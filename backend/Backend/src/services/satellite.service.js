const axios = require('axios');
const sharp = require('sharp');
const logger = require('../utils/logger');
const { uploadToR2 } = require('../utils/r2');

const ZOOM = 20;
const TILE_SIZE = 512;       // Mapbox @2x retina tiles are 512x512
const OUTPUT_SIZE = 1240;    // final cropped image size sent to AI model
const GRID_SIZE = 5;         // 5x5 grid = 2560x2560 stitched before crop

const latLngToTile = (lat, lng, zoom) => {
  const n = Math.pow(2, zoom);
  const xTile = Math.floor((lng + 180) / 360 * n);
  const yTile = Math.floor(
    (1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * n
  );
  return { xTile, yTile };
};

const latLngToPixel = (lat, lng, zoom) => {
  const n = Math.pow(2, zoom);
  const xPixel = (lng + 180) / 360 * n * TILE_SIZE;
  const yPixel = (
    (1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * n * TILE_SIZE
  );
  return { xPixel, yPixel };
};

// Fetches a single Mapbox satellite @2x tile (512x512) with exponential backoff retry
const fetchTile = async (x, y, zoom, retries = 3, delay = 500) => {
  const token = process.env.MAPBOX_TOKEN;
  const url = `https://api.mapbox.com/v4/mapbox.satellite/${zoom}/${x}/${y}@2x.png?access_token=${token}`;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 5000 });
      return Buffer.from(response.data);
    } catch (error) {
      if (attempt === retries) throw new Error(`Failed to fetch tile (${x},${y}): ${error.message}`);
      await new Promise(res => setTimeout(res, delay * attempt));
    }
  }
};

const geocodeAddress = async (address) => {
  const response = await axios.get('https://nominatim.openstreetmap.org/search', {
    params: { q: address, format: 'json', limit: 1 },
    headers: { 'User-Agent': 'KinsApp/1.0' },
  });
  if (!response.data || response.data.length === 0)
    throw Object.assign(new Error('Address not found'), { statusCode: 404 });
  return { lat: parseFloat(response.data[0].lat), lng: parseFloat(response.data[0].lon) };
};

// Fetches 25 Mapbox @2x tiles in parallel, stitches into 2560x2560,
// crops to OUTPUT_SIZE centred on the target lat/lng, and uploads to R2
const fetchAndProcessImage = async (lat, lng) => {
  const { xTile, yTile } = latLngToTile(lat, lng, ZOOM);
  const { xPixel, yPixel } = latLngToPixel(lat, lng, ZOOM);

  // Fetch all tiles in parallel
  const tilePromises = [];
  for (let dy = -2; dy <= 2; dy++)
    for (let dx = -2; dx <= 2; dx++)
      tilePromises.push(fetchTile(xTile + dx, yTile + dy, ZOOM));

  const flatTiles = await Promise.all(tilePromises);
  const tileGrid = Array.from({ length: GRID_SIZE }, (_, row) =>
    flatTiles.slice(row * GRID_SIZE, (row + 1) * GRID_SIZE)
  );

  // Stitch tiles into one large canvas
  const stitchedSize = TILE_SIZE * GRID_SIZE;
  const compositeArray = [];
  for (let row = 0; row < GRID_SIZE; row++)
    for (let col = 0; col < GRID_SIZE; col++)
      compositeArray.push({ input: tileGrid[row][col], top: row * TILE_SIZE, left: col * TILE_SIZE });

  const stitchedBuffer = await sharp({
    create: { width: stitchedSize, height: stitchedSize, channels: 3, background: { r: 0, g: 0, b: 0 } },
  }).composite(compositeArray).jpeg().toBuffer();

  // Calculate crop window centred on the exact target pixel
  const absX = TILE_SIZE * 2 + (xPixel - xTile * TILE_SIZE);
  const absY = TILE_SIZE * 2 + (yPixel - yTile * TILE_SIZE);
  const half = OUTPUT_SIZE / 2;
  const cropLeft = Math.max(0, Math.min(Math.round(absX - half), stitchedSize - OUTPUT_SIZE));
  const cropTop  = Math.max(0, Math.min(Math.round(absY - half), stitchedSize - OUTPUT_SIZE));

const croppedBuffer = await sharp(stitchedBuffer)
    .extract({ left: cropLeft, top: cropTop, width: OUTPUT_SIZE, height: OUTPUT_SIZE })
    .resize(OUTPUT_SIZE * 2, OUTPUT_SIZE * 2, {          // upscale 2x with lanczos
        kernel: sharp.kernel.lanczos3,
    })
    .sharpen({ sigma: 2.5, m1: 3.0, m2: 0.5 })          // aggressive unsharp mask
    .modulate({ brightness: 1.05, saturation: 1.2 })     // slight brightness + color pop
    .linear(1.2, -(128 * 0.2))                           // contrast stretch
    .resize(OUTPUT_SIZE, OUTPUT_SIZE)                    // scale back down to 2048
    .jpeg({ quality: 95, mozjpeg: true })
    .toBuffer();

  const imagePath = await uploadToR2(croppedBuffer, `${lat}_${lng}.jpg`);
  logger.info(`Satellite image uploaded: ${lat}_${lng}.jpg`);

  return { imagePath, finalX: Math.round(absX - cropLeft), finalY: Math.round(absY - cropTop) };
};

// Resolves lat/lng from req.body — accepts { lat, lng } or { address }
const resolveCoordinates = async ({ address, lat: rawLat, lng: rawLng }) => {
  if (rawLat && rawLng) {
    const lat = parseFloat(rawLat);
    const lng = parseFloat(rawLng);
    if (isNaN(lat) || isNaN(lng))
      throw Object.assign(new Error('Invalid lat/lng values'), { statusCode: 400 });
    return { lat, lng, resolvedAddress: `${lat}, ${lng}` };
  }
  if (address) {
    const { lat, lng } = await geocodeAddress(address);
    return { lat, lng, resolvedAddress: address };
  }
  throw Object.assign(new Error('Provide either an address or lat/lng coordinates'), { statusCode: 400 });
};

module.exports = { fetchAndProcessImage, resolveCoordinates };

// const axios = require('axios');
// const sharp = require('sharp');
// const logger = require('../utils/logger');
// const { uploadToR2 } = require('../utils/r2');

// const ZOOM = 19;
// const TILE_SIZE = 256;       // ESRI tiles are 256x256 (not 512 like Mapbox @2x)
// const OUTPUT_SIZE = 310;    // final cropped image size sent to AI model
// const GRID_SIZE = 7;         // 7x7 grid = 1792x1792 stitched before crop

// const latLngToTile = (lat, lng, zoom) => {
//   const n = Math.pow(2, zoom);
//   const xTile = Math.floor((lng + 180) / 360 * n);
//   const yTile = Math.floor(
//     (1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * n
//   );
//   return { xTile, yTile };
// };

// const latLngToPixel = (lat, lng, zoom) => {
//   const n = Math.pow(2, zoom);
//   const xPixel = (lng + 180) / 360 * n * TILE_SIZE;
//   const yPixel = (
//     (1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * n * TILE_SIZE
//   );
//   return { xPixel, yPixel };
// };

// // Fetches a single ESRI World Imagery tile (256x256) with exponential backoff retry
// const fetchTile = async (x, y, zoom, retries = 3, delay = 500) => {
//   const server = (x + y) % 4; // distributes load across server 0-3
//   const url = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${zoom}/${y}/${x}`;
//   for (let attempt = 1; attempt <= retries; attempt++) {
//     try {
//       const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 5000 });
//       return Buffer.from(response.data);
//     } catch (error) {
//       if (attempt === retries) throw new Error(`Failed to fetch tile (${x},${y}): ${error.message}`);
//       await new Promise(res => setTimeout(res, delay * attempt));
//     }
//   }
// };

// const geocodeAddress = async (address) => {
//   const response = await axios.get('https://nominatim.openstreetmap.org/search', {
//     params: { q: address, format: 'json', limit: 1 },
//     headers: { 'User-Agent': 'KinsApp/1.0' },
//   });
//   if (!response.data || response.data.length === 0)
//     throw Object.assign(new Error('Address not found'), { statusCode: 404 });
//   return { lat: parseFloat(response.data[0].lat), lng: parseFloat(response.data[0].lon) };
// };

// const fetchAndProcessImage = async (lat, lng) => {
//   const { xTile, yTile } = latLngToTile(lat, lng, ZOOM);
//   const { xPixel, yPixel } = latLngToPixel(lat, lng, ZOOM);

//   // Fetch all tiles in parallel
//   const tilePromises = [];
//   const offset = Math.floor(GRID_SIZE / 2); // 3 for 7x7
//   for (let dy = -offset; dy <= offset; dy++)
//     for (let dx = -offset; dx <= offset; dx++)
//       tilePromises.push(fetchTile(xTile + dx, yTile + dy, ZOOM));

//   const flatTiles = await Promise.all(tilePromises);
//   const tileGrid = Array.from({ length: GRID_SIZE }, (_, row) =>
//     flatTiles.slice(row * GRID_SIZE, (row + 1) * GRID_SIZE)
//   );

//   // Stitch tiles into one large canvas
//   const stitchedSize = TILE_SIZE * GRID_SIZE;
//   const compositeArray = [];
//   for (let row = 0; row < GRID_SIZE; row++)
//     for (let col = 0; col < GRID_SIZE; col++)
//       compositeArray.push({ input: tileGrid[row][col], top: row * TILE_SIZE, left: col * TILE_SIZE });

//   const stitchedBuffer = await sharp({
//     create: { width: stitchedSize, height: stitchedSize, channels: 3, background: { r: 0, g: 0, b: 0 } },
//   }).composite(compositeArray).jpeg().toBuffer();

//   // Calculate crop window centred on the exact target pixel
//   const absX = TILE_SIZE * offset + (xPixel - xTile * TILE_SIZE);
//   const absY = TILE_SIZE * offset + (yPixel - yTile * TILE_SIZE);
//   const half = OUTPUT_SIZE / 2;
//   const cropLeft = Math.max(0, Math.min(Math.round(absX - half), stitchedSize - OUTPUT_SIZE));
//   const cropTop = Math.max(0, Math.min(Math.round(absY - half), stitchedSize - OUTPUT_SIZE));

//   const croppedBuffer = await sharp(stitchedBuffer)
//     .extract({ left: cropLeft, top: cropTop, width: OUTPUT_SIZE, height: OUTPUT_SIZE })
//     .resize(1240, 1240, {
//       kernel: sharp.kernel.lanczos3,
//     })
//     .sharpen({ sigma: 1.5, m1: 2.0, m2: 0.5 })
//     .jpeg({ quality: 95, mozjpeg: true })
//     .toBuffer();

//   const imagePath = await uploadToR2(croppedBuffer, `${lat}_${lng}.jpg`);
//   logger.info(`Satellite image uploaded: ${lat}_${lng}.jpg`);

//   const scale = 1240 / OUTPUT_SIZE; // = 4
//   return {
//     imagePath,
//     finalX: Math.round((absX - cropLeft) * scale),
//     finalY: Math.round((absY - cropTop) * scale),
//   };
// };

// const resolveCoordinates = async ({ address, lat: rawLat, lng: rawLng }) => {
//   if (rawLat && rawLng) {
//     const lat = parseFloat(rawLat);
//     const lng = parseFloat(rawLng);
//     if (isNaN(lat) || isNaN(lng))
//       throw Object.assign(new Error('Invalid lat/lng values'), { statusCode: 400 });
//     return { lat, lng, resolvedAddress: `${lat}, ${lng}` };
//   }
//   if (address) {
//     const { lat, lng } = await geocodeAddress(address);
//     return { lat, lng, resolvedAddress: address };
//   }
//   throw Object.assign(new Error('Provide either an address or lat/lng coordinates'), { statusCode: 400 });
// };

// module.exports = { fetchAndProcessImage, resolveCoordinates };

