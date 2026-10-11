import React, { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { Sky } from "three/examples/jsm/objects/Sky";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import SunCalc from "suncalc";

const LAT = 28.6139;
const LNG = 77.209;
const ROOF_AZIMUTH_DEG = 0;
const ROOF_AZIMUTH_RAD = (ROOF_AZIMUTH_DEG * Math.PI) / 180;
const PANEL_W = 1.65;
const PANEL_H = 1.0;
const PANEL_AREA = PANEL_W * PANEL_H;
const PANEL_RATED_W = 330;
const PANEL_TILT_DEG = 10;
const PANEL_TILT_RAD = (PANEL_TILT_DEG * Math.PI) / 180;
const WALL_H = 3.5;
const SLAB_D = 0.12;
const ROOF_Y = WALL_H + SLAB_D + 0.01;
const WINTER_ALT_RAD = ((90 - LAT - 23.45) * Math.PI) / 180;
const ROW_PITCH =
  PANEL_H * Math.cos(PANEL_TILT_RAD) +
  (PANEL_H * Math.sin(PANEL_TILT_RAD)) / Math.tan(WINTER_ALT_RAD);
const ROW_GAP = ROW_PITCH - PANEL_H;
const SOLAR_CONSTANT = 1361;
const PANEL_EFF = 0.2;
const PERF_RATIO = 0.75;
const TEMP_COEFF = -0.004;
const NOCT = 45;
const DC_AC_RATIO = 1.2;
const SYSTEM_LIFE_YEARS = 25;
const DEGRADATION_YEAR1 = 0.02;
const DEGRADATION_ANNUAL = 0.005;
const INDIA_CO2_FACTOR_KG_PER_KWH = 0.708;
const UPPER_ROOF_DEFAULT_H = 1.2;
const UPPER_FLOOR_WALL_H = 2.75;

function getDegradationFactor(year) {
  if (year <= 0) return 1;
  if (year === 1) return 1 - DEGRADATION_YEAR1;
  return (1 - DEGRADATION_YEAR1) * Math.pow(1 - DEGRADATION_ANNUAL, year - 1);
}
const DEGRADATION_FACTORS = Array.from({ length: SYSTEM_LIFE_YEARS }, (_, i) =>
  getDegradationFactor(i + 1)
);

function getInverterClippingFactor(panelCount, poaIrradiance) {
  const systemDC_kW = (panelCount * PANEL_RATED_W) / 1000;
  const inverterAC_kW = systemDC_kW / DC_AC_RATIO;
  const actualDC_kW = systemDC_kW * (poaIrradiance / 1000);
  if (actualDC_kW <= 0) return 1;
  return Math.min(actualDC_kW, inverterAC_kW) / actualDC_kW;
}

// ─── MOCK DATA ────────────────────────────────────────────────
const MOCK_SITE_DATA = {
  roof_polygon: [
    { x: 0, z: 0 },
    { x: 10, z: 0 },
    { x: 10, z: 8 },
    { x: 0, z: 8 },
  ],
  free_space_polygon: [
    { x: 0.6, z: 0.6 },
    { x: 9.4, z: 0.6 },
    { x: 9.4, z: 7.4 },
    { x: 0.6, z: 7.4 },
  ],
  obstacles: [
    {
      height: 1.5,
      points: [
        { x: 0.8, z: 5.5 },
        { x: 2.8, z: 5.5 },
        { x: 2.8, z: 7.5 },
        { x: 0.8, z: 7.5 },
      ],
    },
    {
      height: null,
      points: [
        { x: 0.8, z: 0.8 },
        { x: 2.8, z: 0.8 },
        { x: 2.8, z: 3.0 },
        { x: 0.8, z: 3.0 },
      ],
    },
  ],
  upper_roofs: [
    {
      footprint: [
        { x: 6.0, z: 4.0 },
        { x: 10.0, z: 4.0 },
        { x: 10.0, z: 8.0 },
        { x: 6.0, z: 8.0 },
      ],
      free_space: [
        { x: 6.5, z: 4.5 },
        { x: 9.4, z: 4.5 },
        { x: 9.4, z: 7.4 },
        { x: 6.5, z: 7.4 },
      ],
      obstacles: [
        {
          height: 1.0,
          points: [
            { x: 8.6, z: 6.8 },
            { x: 9.4, z: 6.8 },
            { x: 9.4, z: 7.4 },
            { x: 8.6, z: 7.4 },
          ],
        },
      ],
    },
  ],
};

// ─── VALIDATOR ────────────────────────────────────────────────
function validateSiteData(data) {
  const errors = [];
  if (!data) {
    errors.push("No data received");
    return { valid: false, errors };
  }
  if (!Array.isArray(data.roof_polygon)) errors.push("Missing roof_polygon");
  if (!Array.isArray(data.free_space_polygon))
    errors.push("Missing free_space_polygon");
  if (!Array.isArray(data.obstacles)) errors.push("Missing obstacles array");
  if (data.roof_polygon?.length < 3)
    errors.push("roof_polygon needs ≥3 points");
  if (data.free_space_polygon?.length < 3)
    errors.push("free_space_polygon needs ≥3 points");
  const checkPts = (arr, name) =>
    arr?.forEach((p, i) => {
      if (typeof p.x !== "number" || typeof p.z !== "number")
        errors.push(`${name}[${i}] missing x or z`);
    });
  checkPts(data.roof_polygon, "roof_polygon");
  checkPts(data.free_space_polygon, "free_space_polygon");
  data.obstacles?.forEach((obs, i) => {
    if (!Array.isArray(obs.points) || obs.points.length < 3)
      errors.push(`obstacles[${i}] needs ≥3 points`);
    checkPts(obs.points, `obstacles[${i}].points`);
  });
  return { valid: errors.length === 0, errors };
}

// ─── IRRADIANCE ───────────────────────────────────────────────
const DELHI_MONTHLY_TRANSMITTANCE = [
  0.52, 0.55, 0.6, 0.62, 0.63, 0.6, 0.55, 0.55, 0.58, 0.6, 0.55, 0.5,
];
const DELHI_MONTHLY_TEMPS = [15, 18, 24, 31, 37, 38, 34, 33, 32, 27, 21, 15];
const DELHI_MONTHLY_PSH = [
  3.63, 4.93, 6.11, 6.68, 6.87, 6.13, 4.77, 4.83, 5.27, 5.64, 4.31, 3.34,
];
const DELHI_MONTHLY_SOILING = [
  0.94, 0.94, 0.93, 0.92, 0.88, 0.92, 0.96, 0.97, 0.96, 0.94, 0.93, 0.94,
];
const MONTHLY_CLIPPING_FACTORS = [
  0.98, 0.97, 0.95, 0.94, 0.93, 0.94, 0.96, 0.96, 0.95, 0.96, 0.97, 0.98,
];

function getDelhiElectricityRate(kWh) {
  return kWh <= 200 ? 3.0 : kWh <= 400 ? 5.0 : kWh <= 800 ? 6.5 : 7.0;
}
function getSubsidy(kW) {
  return kW <= 2
    ? Math.round(kW * 30000)
    : kW <= 3
    ? Math.round(60000 + (kW - 2) * 18000)
    : 78000;
}

function getSolarIrradiance(date, lat, lng) {
  const pos = SunCalc.getPosition(date, lat, lng);
  const altitudeDeg = (pos.altitude * 180) / Math.PI;
  if (altitudeDeg <= 0)
    return {
      irradiance: 0,
      poaIrradiance: 0,
      airMass: null,
      effectiveWatts: 0,
      altitudeDeg: 0,
      tempDerating: 1,
      cellTemp: 25,
    };
  const zenithDeg = 90 - altitudeDeg;
  const airMass =
    1 /
    (Math.cos((zenithDeg * Math.PI) / 180) +
      0.50572 * Math.pow(Math.max(0.001, 96.07995 - zenithDeg), -1.6364));
  const month = date.getMonth();
  const ghi =
    SOLAR_CONSTANT * Math.pow(DELHI_MONTHLY_TRANSMITTANCE[month], airMass);
  const altRad = pos.altitude,
    azRad = pos.azimuth;
  const sx = -Math.cos(altRad) * Math.sin(azRad),
    sy = Math.sin(altRad),
    sz = Math.cos(altRad) * Math.cos(azRad);
  const nx = Math.sin(PANEL_TILT_RAD) * Math.sin(ROOF_AZIMUTH_RAD),
    ny = Math.cos(PANEL_TILT_RAD),
    nz = Math.sin(PANEL_TILT_RAD) * Math.cos(ROOF_AZIMUTH_RAD);
  const poaIrradiance = ghi * Math.max(0, sx * nx + sy * ny + sz * nz);
  const cellTemp =
    DELHI_MONTHLY_TEMPS[month] + ((NOCT - 20) / 800) * poaIrradiance;
  const tempDerating = Math.max(0.7, 1 + TEMP_COEFF * (cellTemp - 25));
  const effectiveWatts =
    poaIrradiance *
    PANEL_AREA *
    PANEL_EFF *
    tempDerating *
    PERF_RATIO *
    DELHI_MONTHLY_SOILING[month];
  return {
    irradiance: Math.round(ghi),
    poaIrradiance: Math.round(poaIrradiance),
    airMass: parseFloat(airMass.toFixed(3)),
    effectiveWatts: parseFloat(effectiveWatts.toFixed(1)),
    altitudeDeg: parseFloat(altitudeDeg.toFixed(1)),
    tempDerating: parseFloat(tempDerating.toFixed(3)),
    cellTemp: parseFloat(cellTemp.toFixed(1)),
  };
}

function getMonthlySavings(panelCount) {
  if (panelCount === 0)
    return {
      monthlyKWh: 0,
      monthlySavings: 0,
      monthlyData: [],
      annualKWh: 0,
      unitRate: 5,
      lifetimeKWh: 0,
      lifetimeSavings: 0,
      year1KWh: 0,
      yearlyGeneration: [],
    };
  const systemKWp = (panelCount * PANEL_RATED_W) / 1000;
  const monthlyData = [];
  let year1AnnualKWh = 0;
  for (let m = 0; m < 12; m++) {
    const days = new Date(2025, m + 1, 0).getDate();
    const kWh =
      DELHI_MONTHLY_PSH[m] *
      PERF_RATIO *
      DELHI_MONTHLY_SOILING[m] *
      MONTHLY_CLIPPING_FACTORS[m] *
      days *
      systemKWp;
    year1AnnualKWh += kWh;
    monthlyData.push({ month: m, kWh: Math.round(kWh) });
  }
  let lifetimeKWh = 0;
  const yearlyGeneration = [];
  for (let year = 1; year <= SYSTEM_LIFE_YEARS; year++) {
    const yearKWh = year1AnnualKWh * DEGRADATION_FACTORS[year - 1];
    lifetimeKWh += yearKWh;
    yearlyGeneration.push({
      year,
      kWh: Math.round(yearKWh),
      degradation: DEGRADATION_FACTORS[year - 1],
    });
  }
  const avgMonthlyKWh = year1AnnualKWh / 12;
  const unitRate = getDelhiElectricityRate(avgMonthlyKWh);
  let lifetimeSavings = 0;
  yearlyGeneration.forEach(({ kWh }, i) => {
    lifetimeSavings += kWh * unitRate * Math.pow(1.05, i);
  });
  return {
    monthlyKWh: Math.round(avgMonthlyKWh),
    monthlySavings: Math.round(avgMonthlyKWh * unitRate),
    unitRate,
    monthlyData,
    annualKWh: Math.round(year1AnnualKWh),
    year1KWh: Math.round(year1AnnualKWh),
    lifetimeKWh: Math.round(lifetimeKWh),
    lifetimeSavings: Math.round(lifetimeSavings),
    yearlyGeneration,
  };
}

// ─── SHADOW ───────────────────────────────────────────────────
function buildShadowCasterCache(scene) {
  const out = [];
  scene.traverse((o) => {
    if (
      o.isMesh &&
      !o.userData.isPanel &&
      !o.userData.isGround &&
      !o.userData.isCloud
    )
      out.push(o);
  });
  return out;
}

function computeShadedPanels(panelPositions, sunDirection, shadowCasters) {
  const raycaster = new THREE.Raycaster();
  const sunDir = sunDirection.clone().normalize();
  return panelPositions.map(({ x, z, y }) => {
    const cy =
      (y !== undefined ? y : ROOF_Y) +
      (PANEL_H / 2) * Math.sin(PANEL_TILT_RAD) +
      0.05;
    raycaster.set(new THREE.Vector3(x, cy, z), sunDir);
    raycaster.near = 0.1;
    raycaster.far = 120;
    return raycaster.intersectObjects(shadowCasters, false).length > 0;
  });
}

// ─── TEXTURE ──────────────────────────────────────────────────
function createSolarPanelTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 165;
  canvas.height = 100;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#0a1628";
  ctx.fillRect(0, 0, 165, 100);
  ctx.strokeStyle = "#1a3a5c";
  ctx.lineWidth = 1;
  for (let i = 1; i < 6; i++) {
    ctx.beginPath();
    ctx.moveTo(i * (165 / 6), 0);
    ctx.lineTo(i * (165 / 6), 100);
    ctx.stroke();
  }
  for (let j = 1; j < 4; j++) {
    ctx.beginPath();
    ctx.moveTo(0, j * (100 / 4));
    ctx.lineTo(165, j * (100 / 4));
    ctx.stroke();
  }
  return new THREE.CanvasTexture(canvas);
}

function isInsidePolygon(px, pz, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x,
      zi = polygon[i].z,
      xj = polygon[j].x,
      zj = polygon[j].z;
    if (zi > pz !== zj > pz && px < ((xj - xi) * (pz - zi)) / (zj - zi) + xi)
      inside = !inside;
  }
  return inside;
}

// ─────────────────────────────────────────────────────────────
// 🔑 placePanelsFromOverride
// ─────────────────────────────────────────────────────────────
// 👈 FIXED: Upper Roof Height checking added for Override Panels
// ─────────────────────────────────────────────────────────────
// 🔑 placePanelsFromOverride (UPDATED: Limits + Upper Roof Height)
// ─────────────────────────────────────────────────────────────
function placePanelsFromOverride(scene, overridePanels, siteData, maxAllowedPanels = Infinity) {
  const panelGroup = new THREE.Group();
  const panelTexture = createSolarPanelTexture();
  const frameMat = new THREE.LineBasicMaterial({ color: 0xc0c8d0 });
  const panelMeshes = [];
  const positions = [];

  let activeCount = 0; // 👈 Track panels to enforce limit

  overridePanels.forEach(({ x, z, pw, ph, on }) => {
    // 1. Agar panel "Off" hai (greyed out in editor), toh skip karo
    if (on === false) return;

    // 2. Agar limit reach ho gayi hai, toh aur panel mat banao
    if (activeCount >= maxAllowedPanels) return;
    
    activeCount++; // Count this panel

    const pW = pw || PANEL_W, pH = ph || PANEL_H;
    const geo = new THREE.PlaneGeometry(pW, pH);
    const mat = new THREE.MeshStandardMaterial({ 
      map: panelTexture, 
      color: 0x1a3a6e, 
      roughness: 0.1, 
      metalness: 0.3, 
      side: THREE.DoubleSide 
    });
    const panel = new THREE.Mesh(geo, mat);
    const rearEdgeLift = (pH / 2) * Math.sin(PANEL_TILT_RAD);

    // 3. Height Logic: Default main roof height hai
    let currentY = ROOF_Y;
    
    // Agar panel kisi upper roof ke andar hai, toh uski Y height badha do
    if (siteData && siteData.upper_roofs) {
      siteData.upper_roofs.forEach(ur => {
        if (isInsidePolygon(x, z, ur.footprint)) {
          // Upper roof ki total height (wall + slab) add kar rahe hain
          currentY = ROOF_Y + UPPER_FLOOR_WALL_H + 0.15+0.02; 
        }
      });
    }

    panel.position.set(x, currentY + rearEdgeLift, z);
    panel.rotation.order = "YXZ";
    panel.rotation.y = -ROOF_AZIMUTH_RAD;
    panel.rotation.x = Math.PI / 2 - PANEL_TILT_RAD;
    panel.castShadow = true;
    panel.receiveShadow = true;
    panel.userData.isPanel = true;
    panelGroup.add(panel);

    const frame = new THREE.LineSegments(new THREE.EdgesGeometry(geo), frameMat);
    frame.position.set(0, 0.002, 0);
    panel.add(frame);
    
    panelMeshes.push(panel);
    positions.push({ x, z, y: currentY });
  });

  scene.add(panelGroup);
  return { panelGroup, panelMeshes, panelCount: panelMeshes.length, positions };
}

// ─── GLOBAL AUTO-GRID HELPER (Collects valid positions but doesn't render) ───
function getGridPositions(freeSpacePolygon, obstacles, surfaceY, isUpperRoof = false) {
  const COL_GAP = 0.02, SAFETY = 0.5;
  const LANDSCAPE_PITCH = PANEL_W * Math.cos(PANEL_TILT_RAD) + (PANEL_W * Math.sin(PANEL_TILT_RAD)) / Math.tan(WINTER_ALT_RAD);
  const LANDSCAPE_ROW_GAP = LANDSCAPE_PITCH - PANEL_W;

  const obstacleBounds = (obstacles || []).map((obs) => {
    const xs = obs.points.map((p) => p.x), zs = obs.points.map((p) => p.z);
    return { minX: Math.min(...xs) - SAFETY, maxX: Math.max(...xs) + SAFETY, minZ: Math.min(...zs) - SAFETY, maxZ: Math.max(...zs) + SAFETY };
  });
  
  const blocked = (px, pz, pw, ph) => {
    const hw = pw / 2, hh = ph / 2;
    return obstacleBounds.some(b => px - hw < b.maxX && px + hw > b.minX && pz - hh < b.maxZ && pz + hh > b.minZ);
  };

  const fsXs = freeSpacePolygon.map((p) => p.x), fsZs = freeSpacePolygon.map((p) => p.z);
  const fsMinX = Math.min(...fsXs), fsMinZ = Math.min(...fsZs);
  const spanX = Math.max(...fsXs) - fsMinX, spanZ = Math.abs(Math.max(...fsZs) - fsMinZ);

  function scanGrid(pw, ph, rowGap, ox, oz) {
    const colPitch = pw + COL_GAP, rowPitch = ph + rowGap, out = [];
    for (let col = 0; col * colPitch < spanX + pw; col++) {
      for (let row = 0; row * rowPitch < spanZ + ph; row++) {
        const x = fsMinX + ox + col * colPitch + pw / 2, z = fsMinZ + oz + row * rowPitch + ph / 2;
        const hw = pw / 2, hh = ph / 2;
        if (![[x - hw, z - hh], [x + hw, z - hh], [x - hw, z + hh], [x + hw, z + hh]].every(([cx, cz]) => isInsidePolygon(cx, cz, freeSpacePolygon))) continue;
        if (blocked(x, z, pw, ph)) continue;
        out.push({ x, z, y: surfaceY, pw, ph, isUpperRoof });
      }
    }
    return out;
  }

  let best = { count: 0, positions: [], orientation: "portrait" };
  [{ name: "portrait", pw: PANEL_W, ph: PANEL_H, rowGap: ROW_GAP }, { name: "landscape", pw: PANEL_H, ph: PANEL_W, rowGap: LANDSCAPE_ROW_GAP }]
  .forEach(({ name, pw, ph, rowGap }) => {
    for (let si = 0; si < 20; si++)
      for (let sj = 0; sj < 20; sj++) {
        const pos = scanGrid(pw, ph, rowGap, (si / 20) * (pw + COL_GAP), (sj / 20) * (ph + rowGap));
        if (pos.length > best.count) best = { count: pos.length, positions: pos, orientation: name };
      }
  });
  return best;
}

// ─── UPPER ROOF STRUCTURES (walls + slabs only, no panels here) ──
function createUpperRoofStructures(scene, upperRoofs) {
  if (!upperRoofs || upperRoofs.length === 0) return { urYMap: [] };
  const urYMap = [];

  upperRoofs.forEach((ur, idx) => {
    const SLAB_T = 0.15,
      wallH = UPPER_FLOOR_WALL_H;
    const urY = ROOF_Y + wallH + SLAB_T;
    urYMap.push({
      idx,
      urY,
      free_space: ur.free_space,
      obstacles: ur.obstacles || [],
    });

    const shape = new THREE.Shape();
    shape.moveTo(ur.footprint[0].x, -ur.footprint[0].z);
    for (let i = 1; i < ur.footprint.length; i++)
      shape.lineTo(ur.footprint[i].x, -ur.footprint[i].z);
    shape.closePath();

    const wall = new THREE.Mesh(
      new THREE.ExtrudeGeometry(shape, { depth: wallH, bevelEnabled: false }),
      new THREE.MeshStandardMaterial({
        color: 0x9aabb8,
        roughness: 0.75,
        metalness: 0.1,
      })
    );
    wall.rotation.x = -Math.PI / 2;
    wall.position.y = ROOF_Y;
    wall.castShadow = true;
    wall.receiveShadow = true;
    scene.add(wall);

    const slabGeo = new THREE.ExtrudeGeometry(shape, {
      depth: SLAB_T,
      bevelEnabled: false,
    });
    const slab = new THREE.Mesh(
      slabGeo,
      new THREE.MeshStandardMaterial({
        color: 0xc8d4d8,
        roughness: 0.55,
        metalness: 0.15,
      })
    );
    slab.rotation.x = -Math.PI / 2;
    slab.position.y = ROOF_Y + wallH;
    slab.castShadow = true;
    slab.receiveShadow = true;
    scene.add(slab);

    const slabLines = new THREE.LineSegments(
      new THREE.EdgesGeometry(slabGeo),
      new THREE.LineBasicMaterial({ color: 0x4fc3f7 })
    );
    slabLines.rotation.x = -Math.PI / 2;
    slabLines.position.y = urY + 0.001;
    scene.add(slabLines);

    // Free space overlay
    const fsPts = ur.free_space.map((p) => new THREE.Vector3(p.x, urY, p.z));
    fsPts.push(fsPts[0]);
    scene.add(
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(fsPts),
        new THREE.LineBasicMaterial({ color: 0x00ff88 })
      )
    );

    if (ur.obstacles?.length) createObstaclesAtHeight(scene, ur.obstacles, urY);

    // Label
    const fpXs = ur.footprint.map((p) => p.x),
      fpZs = ur.footprint.map((p) => p.z);
    const lc = document.createElement("canvas");
    lc.width = 256;
    lc.height = 64;
    const lctx = lc.getContext("2d");
    lctx.fillStyle = "rgba(0,0,0,0.80)";
    lctx.beginPath();
    lctx.roundRect(4, 4, 248, 56, 10);
    lctx.fill();
    lctx.fillStyle = "#00ff88";
    lctx.fillRect(4, 4, 6, 56);
    lctx.fillStyle = "#ffffff";
    lctx.font = "bold 18px Arial";
    lctx.fillText(`Upper Roof ${idx + 1}`, 18, 28);
    lctx.fillStyle = "#88ffbb";
    lctx.font = "13px Arial";
    lctx.fillText(`+${wallH.toFixed(1)}m floor`, 18, 48);
    const label = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: new THREE.CanvasTexture(lc),
        transparent: true,
        depthWrite: false,
      })
    );
    label.scale.set(2.4, 0.7, 1);
    label.position.set(
      (Math.min(...fpXs) + Math.max(...fpXs)) / 2,
      urY + 1.0,
      (Math.min(...fpZs) + Math.max(...fpZs)) / 2
    );
    scene.add(label);
  });

  return { urYMap };
}

// ─── OBSTACLES ────────────────────────────────────────────────
function makeObstacleLabel(text, isUnknown) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "rgba(0,0,0,0.85)";
  ctx.beginPath();
  ctx.roundRect(4, 4, 248, 56, 10);
  ctx.fill();
  ctx.fillStyle = isUnknown ? "#ff8800" : "#ff4444";
  ctx.fillRect(4, 4, 6, 56);
  ctx.font = "20px serif";
  ctx.fillText(isUnknown ? "❓" : "⚠️", 16, 38);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 18px Arial";
  ctx.fillText(text, 46, 28);
  ctx.fillStyle = isUnknown ? "#ffaa44" : "#ff6666";
  ctx.font = "13px Arial";
  ctx.fillText(isUnknown ? "HEIGHT UNKNOWN" : "NO PANELS ZONE", 46, 48);
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: new THREE.CanvasTexture(canvas),
      transparent: true,
      depthWrite: false,
    })
  );
  sprite.scale.set(2.2, 0.7, 1);
  return sprite;
}

function createObstaclesAtHeight(scene, obstacles, baseY) {
  const DEFAULT_H = 0.6,
    SAFETY = 0.5;
  const group = new THREE.Group();
  obstacles.forEach((obs, idx) => {
    const unknown = obs.height == null;
    const h = unknown ? DEFAULT_H : obs.height;
    const col = unknown ? 0xff8800 : 0xff3333,
      wire = unknown ? 0xffaa00 : 0xff0000;
    const xs = obs.points.map((p) => p.x),
      zs = obs.points.map((p) => p.z);
    const minX = Math.min(...xs),
      maxX = Math.max(...xs),
      minZ = Math.min(...zs),
      maxZ = Math.max(...zs);
    const cx = (minX + maxX) / 2,
      cz = (minZ + maxZ) / 2,
      oW = maxX - minX,
      oD = Math.abs(maxZ - minZ);
    const boxGeo = new THREE.BoxGeometry(oW, h, oD);
    const mesh = new THREE.Mesh(
      boxGeo,
      new THREE.MeshStandardMaterial({
        color: col,
        roughness: 0.8,
        transparent: true,
        opacity: 0.85,
      })
    );
    mesh.position.set(cx, baseY + h / 2, cz);
    mesh.castShadow = true;
    mesh.userData.isObstacle = true;
    group.add(mesh);
    const wireL = new THREE.LineSegments(
      new THREE.EdgesGeometry(boxGeo),
      new THREE.LineBasicMaterial({ color: wire })
    );
    wireL.position.copy(mesh.position);
    group.add(wireL);
    const zW = oW + SAFETY * 2,
      zD = oD + SAFETY * 2;
    const zone = new THREE.Mesh(
      new THREE.PlaneGeometry(zW, zD),
      new THREE.MeshStandardMaterial({
        color: col,
        transparent: true,
        opacity: 0.25,
        depthWrite: false,
        side: THREE.DoubleSide,
      })
    );
    zone.rotation.x = -Math.PI / 2;
    zone.position.set(cx, baseY + 0.01, cz);
    group.add(zone);
    const border = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.PlaneGeometry(zW, zD)),
      new THREE.LineBasicMaterial({ color: wire })
    );
    border.rotation.x = -Math.PI / 2;
    border.position.set(cx, baseY + 0.02, cz);
    group.add(border);
    const lbl = makeObstacleLabel(`Obstacle ${idx + 1}`, unknown);
    lbl.position.set(cx, baseY + h + 0.8, cz);
    group.add(lbl);
  });
  scene.add(group);
  return group;
}

function createObstacles(scene, obstacles) {
  return createObstaclesAtHeight(scene, obstacles, ROOF_Y);
}

// ─── ROOF OUTLINES / BUILDING ─────────────────────────────────
function drawRoofOutline(scene, polygon, color = 0x4fc3f7) {
  const pts = polygon.map((p) => new THREE.Vector3(p.x, ROOF_Y, p.z));
  pts.push(pts[0]);
  scene.add(
    new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(pts),
      new THREE.LineBasicMaterial({ color })
    )
  );
}
function drawFreeSpace(scene, polygon) {
  drawRoofOutline(scene, polygon, 0x00ff88);
  const pos = [],
    n = polygon.length;
  for (let i = 1; i < n - 1; i++)
    pos.push(
      polygon[0].x,
      ROOF_Y - 0.01,
      polygon[0].z,
      polygon[i].x,
      ROOF_Y - 0.01,
      polygon[i].z,
      polygon[i + 1].x,
      ROOF_Y - 0.01,
      polygon[i + 1].z
    );
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.computeVertexNormals();
  scene.add(
    new THREE.Mesh(
      geo,
      new THREE.MeshStandardMaterial({
        color: 0x00ff88,
        transparent: true,
        opacity: 0.12,
        depthWrite: false,
        side: THREE.DoubleSide,
      })
    )
  );
}
function buildFromPolygon(scene, roofPolygon) {
  const shape = new THREE.Shape();
  shape.moveTo(roofPolygon[0].x, -roofPolygon[0].z);
  for (let i = 1; i < roofPolygon.length; i++)
    shape.lineTo(roofPolygon[i].x, -roofPolygon[i].z);
  shape.closePath();
  const bld = new THREE.Mesh(
    new THREE.ExtrudeGeometry(shape, { depth: WALL_H, bevelEnabled: false }),
    new THREE.MeshStandardMaterial({
      color: 0x8a9bb0,
      roughness: 0.75,
      metalness: 0.1,
    })
  );
  bld.rotation.x = -Math.PI / 2;
  bld.castShadow = true;
  bld.receiveShadow = true;
  scene.add(bld);
  const roofGeo = new THREE.ExtrudeGeometry(shape, {
    depth: SLAB_D,
    bevelEnabled: false,
  });
  const roofMesh = new THREE.Mesh(
    roofGeo,
    new THREE.MeshStandardMaterial({
      color: 0xb0bec5,
      roughness: 0.6,
      metalness: 0.2,
    })
  );
  roofMesh.rotation.x = -Math.PI / 2;
  roofMesh.position.y = WALL_H;
  roofMesh.castShadow = true;
  roofMesh.receiveShadow = true;
  scene.add(roofMesh);
  const roofLines = new THREE.LineSegments(
    new THREE.EdgesGeometry(roofGeo),
    new THREE.LineBasicMaterial({ color: 0x4fc3f7 })
  );
  roofLines.rotation.x = -Math.PI / 2;
  roofLines.position.y = WALL_H + SLAB_D + 0.001;
  scene.add(roofLines);
}

// ─── GROUND / TREES / CLOUDS ──────────────────────────────────
function createRealisticGround(scene) {
  const S = 512,
    canvas = document.createElement("canvas");
  canvas.width = S;
  canvas.height = S;
  const ctx = canvas.getContext("2d");
  const rng = (seed) => {
    let s = seed;
    return () => {
      s = (s * 16807) % 2147483647;
      return (s - 1) / 2147483646;
    };
  };
  const rand = rng(42);
  ctx.fillStyle = "#7a6a4e";
  ctx.fillRect(0, 0, S, S);
  for (let i = 0; i < 600; i++) {
    const x = rand() * S,
      y = rand() * S,
      r = rand() * 28 + 6;
    ctx.globalAlpha = 0.35 + rand() * 0.4;
    ctx.fillStyle =
      rand() > 0.6 ? "#8b7d55" : rand() > 0.3 ? "#6e7a3a" : "#5a6830";
    ctx.beginPath();
    ctx.ellipse(
      x,
      y,
      r,
      r * (0.4 + rand() * 0.5),
      rand() * Math.PI,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }
  for (let i = 0; i < 1200; i++) {
    ctx.globalAlpha = 0.15 + rand() * 0.25;
    ctx.fillStyle = rand() > 0.5 ? "#9b8b6a" : "#5a4e35";
    ctx.beginPath();
    ctx.arc(rand() * S, rand() * S, rand() * 3 + 0.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  const groundTex = new THREE.CanvasTexture(canvas);
  groundTex.wrapS = groundTex.wrapT = THREE.RepeatWrapping;
  groundTex.repeat.set(8, 8);
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(160, 160),
    new THREE.MeshStandardMaterial({
      map: groundTex,
      roughness: 0.95,
      metalness: 0,
      color: 0xd4c4a0,
    })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.01;
  ground.receiveShadow = true;
  ground.userData.isGround = true;
  scene.add(ground);
  return ground;
}
function createDistantTrees(scene, roofPolygon, glbUrl) {
  const rxs = roofPolygon.map((p) => p.x),
    rzs = roofPolygon.map((p) => p.z);
  const cx = (Math.min(...rxs) + Math.max(...rxs)) / 2,
    cz = (Math.min(...rzs) + Math.max(...rzs)) / 2;
  const positions = [
    { x: cx - 38, z: cz - 30, ry: 0.0, sc: 1.0 },
    { x: cx - 26, z: cz - 35, ry: 0.8, sc: 1.15 },
    { x: cx - 13, z: cz - 33, ry: 1.6, sc: 0.9 },
    { x: cx - 1, z: cz - 37, ry: 2.4, sc: 1.05 },
    { x: cx + 11, z: cz - 35, ry: 3.2, sc: 1.2 },
    { x: cx + 23, z: cz - 33, ry: 0.4, sc: 0.95 },
    { x: cx + 34, z: cz - 29, ry: 1.2, sc: 1.1 },
    { x: cx + 41, z: cz - 15, ry: 2.0, sc: 1.0 },
    { x: cx + 43, z: cz + 2, ry: 2.8, sc: 1.15 },
    { x: cx + 40, z: cz + 18, ry: 0.6, sc: 0.9 },
    { x: cx + 33, z: cz + 30, ry: 1.4, sc: 1.05 },
    { x: cx + 18, z: cz + 36, ry: 3.0, sc: 1.2 },
    { x: cx + 4, z: cz + 34, ry: 0.2, sc: 1.0 },
    { x: cx - 11, z: cz + 36, ry: 1.0, sc: 0.95 },
    { x: cx - 26, z: cz + 33, ry: 1.8, sc: 1.1 },
    { x: cx - 36, z: cz + 24, ry: 2.6, sc: 1.0 },
    { x: cx - 42, z: cz + 9, ry: 3.4, sc: 1.15 },
    { x: cx - 41, z: cz - 8, ry: 0.9, sc: 0.9 },
  ];
  const loader = new GLTFLoader();
  loader.load(
    glbUrl,
    (gltf) => {
      const proto = gltf.scene,
        TREE_SCALE = 11,
        Y_OFFSET = 0.47 * TREE_SCALE;
      proto.traverse((o) => {
        if (o.isMesh) {
          o.castShadow = true;
          o.receiveShadow = false;
          if (o.material) o.material.side = THREE.DoubleSide;
        }
      });
      positions.forEach(({ x, z, ry, sc }) => {
        const clone = proto.clone(true);
        clone.position.set(x, Y_OFFSET * sc, z);
        clone.rotation.y = ry;
        clone.scale.setScalar(TREE_SCALE * sc);
        clone.userData.isTree = true;
        scene.add(clone);
      });
    },
    undefined,
    (err) => console.warn("tree.glb:", err)
  );
}
const CLOUD_VERT = `varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`;
const CLOUD_FRAG = `precision highp float;uniform float uTime;uniform float uSeed;varying vec2 vUv;float hash(vec2 p){p=fract(p*vec2(234.34,435.345));p+=dot(p,p+34.23);return fract(p.x*p.y);}float noise(vec2 p){vec2 i=floor(p);vec2 f=fract(p);vec2 u=f*f*(3.0-2.0*f);return mix(mix(hash(i),hash(i+vec2(1,0)),u.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x),u.y);}float fbm(vec2 p){float v=0.0,a=0.5;mat2 rot=mat2(0.8,0.6,-0.6,0.8);for(int i=0;i<6;i++){v+=a*noise(p);p=rot*p*2.1+vec2(100.0);a*=0.5;}return v;}void main(){vec2 uv=vUv-0.5;vec2 off=vec2(uSeed*3.7,uSeed*5.3);vec2 drift=vec2(uTime*0.004,0.0);float n1=fbm(uv*3.0+off+drift);float n2=fbm(uv*7.0+off*1.3-drift*0.5);float density=n1*0.6+n2*0.4;float edgeFade=1.0-smoothstep(0.28,0.52,length(uv));float alpha=smoothstep(0.44,0.70,density)*edgeFade;if(alpha<0.015)discard;float bright=1.0-smoothstep(0.58,0.85,density)*0.15;vec3 col=mix(vec3(0.75,0.78,0.86),vec3(1.0),bright*0.88);gl_FragColor=vec4(col,alpha*0.88);}`;
function createClouds(scene) {
  const cloudGroup = new THREE.Group();
  cloudGroup.userData.isCloud = true;
  const timeUniform = { value: 0 };
  [
    { x: 30, y: 40, z: -60, w: 180, d: 120, seed: 0.13 },
    { x: -70, y: 45, z: -30, w: 220, d: 140, seed: 0.37 },
    { x: 90, y: 38, z: 40, w: 190, d: 110, seed: 0.61 },
    { x: -30, y: 50, z: 80, w: 240, d: 160, seed: 0.84 },
    { x: 120, y: 42, z: -80, w: 200, d: 130, seed: 0.19 },
    { x: -110, y: 48, z: 60, w: 210, d: 140, seed: 0.45 },
    { x: 40, y: 55, z: -130, w: 260, d: 170, seed: 0.72 },
    { x: -90, y: 43, z: -90, w: 170, d: 115, seed: 0.91 },
  ].forEach(({ x, y, z, w, d, seed }) => {
    const mat = new THREE.ShaderMaterial({
      uniforms: { uTime: timeUniform, uSeed: { value: seed } },
      vertexShader: CLOUD_VERT,
      fragmentShader: CLOUD_FRAG,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat);
    mesh.position.set(x, y, z);
    mesh.rotation.x = -Math.PI / 2;
    mesh.userData.isCloud = true;
    cloudGroup.add(mesh);
  });
  scene.add(cloudGroup);
  return { cloudGroup, timeUniform };
}

// ══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════
const RoofCanva = ({
  siteData: propSiteData = null,
  panelOverride = null,
  sanctionedLoadKW = null, // 👈 NEW PROP
  onHudUpdate,
  externalSlider,
}) => {
  const canvasRef = useRef(null);
  const [loadState, setLoadState] = useState("loading");
  const [loadError, setLoadError] = useState([]);

  const sceneRef = useRef(null),
    sunLightRef = useRef(null),
    skyUniformsRef = useRef(null),
    skyRef = useRef(null);
  const pmremRef = useRef(null),
    sceneEnvRef = useRef(null),
    renderTargetRef = useRef(null);
  const panelMeshesRef = useRef([]),
    panelCountRef = useRef(0),
    panelPositionsRef = useRef([]);
  const sunVecRef = useRef(new THREE.Vector3(0, 1, 0));
  const financialRef = useRef({
    monthlySavings: 0,
    monthlyKWh: 0,
    annualKWh: 0,
    unitRate: 7,
    lifetimeKWh: 0,
    lifetimeSavings: 0,
    monthlyData: [],
    yearlyGeneration: [],
  });
  const isRealtimeRef = useRef(true),
    orientationRef = useRef("portrait");
  const shadowCasterCacheRef = useRef([]),
    cloudGroupRef = useRef(null),
    cloudTimeRef = useRef(null);

  const updateSunToDate = useCallback(
    (date) => {
      if (!sceneRef.current || !sunLightRef.current) return;
      const pos = SunCalc.getPosition(date, LAT, LNG);
      const elevation = (pos.altitude * 180) / Math.PI,
        isDay = elevation > 0;
      const phi = THREE.MathUtils.degToRad(90 - elevation),
        theta = -pos.azimuth;
      const sunVec = new THREE.Vector3().setFromSphericalCoords(1, phi, theta);
      sunVecRef.current = sunVec;
      skyUniformsRef.current["sunPosition"].value.copy(sunVec);
      sunLightRef.current.position.copy(sunVec).multiplyScalar(50);
      sunLightRef.current.intensity = Math.max(0, sunVec.y) * 3 + 0.5;
      if (renderTargetRef.current) renderTargetRef.current.dispose();
      sceneEnvRef.current.add(skyRef.current);
      renderTargetRef.current = pmremRef.current.fromScene(sceneEnvRef.current);
      sceneRef.current.add(skyRef.current);
      sceneRef.current.environment = renderTargetRef.current.texture;
      const {
        irradiance,
        poaIrradiance,
        effectiveWatts,
        cellTemp,
        tempDerating,
      } = getSolarIrradiance(date, LAT, LNG);
      const panelCount = panelCountRef.current;
      const clippingFactor = isDay
        ? getInverterClippingFactor(panelCount, poaIrradiance)
        : 1;
      let shadedCount = 0,
        unshadedCount = panelCount;
      if (isDay && panelPositionsRef.current.length > 0) {
        const shadedMap = computeShadedPanels(
          panelPositionsRef.current,
          sunVec,
          shadowCasterCacheRef.current
        );
        shadedCount = shadedMap.filter(Boolean).length;
        unshadedCount = panelCount - shadedCount;
        panelMeshesRef.current.forEach((mesh, i) => {
          if (shadedMap[i]) {
            mesh.material.color.setHex(0x3a1010);
            mesh.material.emissive.setHex(0x200000);
          } else {
            const t = Math.min(poaIrradiance / 950, 1);
            mesh.material.color.setRGB(
              0.05 + t * 0.05,
              0.15 + t * 0.2,
              0.3 + t * 0.35
            );
            mesh.material.emissive.setRGB(0, t * 0.04, t * 0.12);
          }
        });
      } else if (!isDay) {
        panelMeshesRef.current.forEach((mesh) => {
          mesh.material.color.setHex(0x050d1a);
          mesh.material.emissive.setHex(0x000000);
        });
      }
      const currentKW = parseFloat(
        ((unshadedCount * effectiveWatts * clippingFactor) / 1000).toFixed(2)
      );
      const systemKW = parseFloat(
        ((panelCount * PANEL_RATED_W) / 1000).toFixed(1)
      );
      const h = date.getHours(),
        m = date.getMinutes();
      const timeLabel = `${h % 12 || 12}:${String(m).padStart(2, "0")} ${
        h >= 12 ? "PM" : "AM"
      }`;
      const {
        monthlySavings,
        monthlyKWh,
        annualKWh,
        unitRate,
        lifetimeKWh,
        lifetimeSavings,
      } = financialRef.current;
      const subsidy = getSubsidy(systemKW),
        installCost = systemKW * 55000,
        netCost = installCost - subsidy;
      const annualSavings = monthlyKWh * 12 * unitRate;
      const paybackYears =
        annualSavings > 0
          ? parseFloat((netCost / annualSavings).toFixed(1))
          : 0;
      const co2OffsetTonnes = parseFloat(
        ((lifetimeKWh * INDIA_CO2_FACTOR_KG_PER_KWH) / 1000).toFixed(1)
      );
      const year25Output = parseFloat(
        (annualKWh * (DEGRADATION_FACTORS[24] || 1)).toFixed(0)
      );
      if (onHudUpdate)
        onHudUpdate({
          panelCount,
          systemKW,
          irradiance,
          poaIrradiance,
          currentKW,
          monthlySavings,
          monthlyKWh,
          annualKWh,
          subsidy,
          paybackYears,
          timeLabel,
          isDay,
          shadedPanels: shadedCount,
          cellTemp,
          unitRate,
          tempDerating,
          orientation: orientationRef.current,
          lifetimeKWh,
          lifetimeSavings,
          clippingFactor: parseFloat(clippingFactor.toFixed(3)),
          co2OffsetTonnes,
          year25Output,
          monthlyData: financialRef.current.monthlyData || [],
          yearlyGeneration: financialRef.current.yearlyGeneration || [],
        });
    },
    [onHudUpdate]
  );

  useEffect(() => {
    if (!externalSlider) return;
    isRealtimeRef.current = externalSlider.isRealtime;
    if (externalSlider.isRealtime) {
      updateSunToDate(new Date());
    } else {
      const d = new Date();
      d.setHours(
        Math.floor(externalSlider.val / 60),
        externalSlider.val % 60,
        0,
        0
      );
      updateSunToDate(d);
    }
  }, [externalSlider, updateSunToDate]);

  useEffect(() => {
    const siteData = propSiteData;
if (!siteData) {
  setLoadError(["No site data available"]);
  setLoadState("error");
  return;
}
    const { valid, errors } = validateSiteData(siteData);
    if (!valid) {
      setLoadError(errors);
      setLoadState("error");
      return;
    }

    try {
      const container = canvasRef.current.parentElement;
      const getW = () => container.offsetWidth || 800,
        getH = () => container.offsetHeight || 520;
      const renderer = new THREE.WebGLRenderer({
        canvas: canvasRef.current,
        antialias: true,
      });
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 0.8;
      renderer.setSize(getW(), getH());
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.domElement.addEventListener("webglcontextlost", (e) => {
        e.preventDefault();
        setLoadState("error");
        setLoadError(["3D engine crashed"]);
      });

      const scene = new THREE.Scene();
      sceneRef.current = scene;
      const sky = new Sky();
      sky.scale.setScalar(450000);
      scene.add(sky);
      skyRef.current = sky;
      const skyUniforms = sky.material.uniforms;
      skyUniforms["turbidity"].value = 10;
      skyUniforms["rayleigh"].value = 2;
      skyUniforms["mieCoefficient"].value = 0.005;
      skyUniforms["mieDirectionalG"].value = 0.9995;
      skyUniformsRef.current = skyUniforms;
      const pmremGenerator = new THREE.PMREMGenerator(renderer);
      pmremRef.current = pmremGenerator;
      sceneEnvRef.current = new THREE.Scene();

      const rxs = siteData.roof_polygon.map((p) => p.x),
        rzs = siteData.roof_polygon.map((p) => p.z);
      const roofW = Math.max(...rxs) - Math.min(...rxs),
        roofD = Math.abs(Math.max(...rzs) - Math.min(...rzs));
      const shadowExtent = Math.max(roofW, roofD) * 0.8 + 8;
      const sunLight = new THREE.DirectionalLight(0xffffff, 3);
      sunLight.castShadow = true;
      sunLight.shadow.mapSize.width = 2048;
      sunLight.shadow.mapSize.height = 2048;
      sunLight.shadow.camera.near = 0.5;
      sunLight.shadow.camera.far = 80;
      sunLight.shadow.camera.left = -shadowExtent;
      sunLight.shadow.camera.right = shadowExtent;
      sunLight.shadow.camera.top = shadowExtent;
      sunLight.shadow.camera.bottom = -shadowExtent;
      scene.add(sunLight);
      sunLightRef.current = sunLight;
      scene.add(new THREE.AmbientLight(0x6688aa, 1.5));

      drawRoofOutline(scene, siteData.roof_polygon, 0x4fc3f7);
      drawFreeSpace(scene, siteData.free_space_polygon);
      buildFromPolygon(scene, siteData.roof_polygon);

      const { urYMap } = createUpperRoofStructures(
        scene,
        siteData.upper_roofs || []
      );
      createObstacles(scene, siteData.obstacles);

      let allPanelMeshes = [],
        allPositions = [],
        totalPanelCount = 0;

      // Yahan upar remainingPanels pehle calculate karo
      let remainingPanels = (sanctionedLoadKW && sanctionedLoadKW > 0) 
          ? Math.floor((sanctionedLoadKW * DC_AC_RATIO * 1000) / PANEL_RATED_W) 
          : Infinity;

      if (panelOverride && panelOverride.length > 0) {
        // 👈 FIXED: Pass remainingPanels as 4th argument
        const result = placePanelsFromOverride(scene, panelOverride, siteData, remainingPanels);
        allPanelMeshes = result.panelMeshes;
        allPositions = result.positions;
        totalPanelCount = result.panelCount;
        orientationRef.current = "portrait";
        console.log(`✅ Override: ${totalPanelCount} active panels`);
      } else {
        // 👇 GLOBAL AUTO-GRID MODE (Scores Main & Upper Roofs together) 👇
        let remainingPanels = (sanctionedLoadKW && sanctionedLoadKW > 0) 
          ? Math.floor((sanctionedLoadKW * DC_AC_RATIO * 1000) / PANEL_RATED_W) 
          : Infinity;

        const upperExclusions = (siteData.upper_roofs || []).map((ur) => ({ height: UPPER_FLOOR_WALL_H, points: ur.footprint, isUpperRoof: true }));
        const mainObs = [...(siteData.obstacles || []).map(o => ({...o, isUpperRoof: false})), ...upperExclusions];
        
        let possiblePositions = [];
        let physicalMaxCapacity = 0;

        // 1. Get Main Roof Positions
        const mainGrid = getGridPositions(siteData.free_space_polygon, mainObs, ROOF_Y, false);
        possiblePositions.push(...mainGrid.positions);
        physicalMaxCapacity += mainGrid.count;

        // 2. Get Upper Roof Positions
        urYMap.forEach(({ urY, free_space, obstacles: urObs }) => {
          const upGrid = getGridPositions(free_space, (urObs || []).map(o => ({...o, isUpperRoof: false})), urY, true);
          possiblePositions.push(...upGrid.positions);
          physicalMaxCapacity += upGrid.count;
        });

        // 3. Globally Score All Positions
        // 3. Globally Score All Positions
        possiblePositions.forEach(pos => {
          let minDist = Infinity;
          mainObs.forEach(ob => {
            const isInside = isInsidePolygon(pos.x, pos.z, ob.points); // 👈 FIXED HERE
            // Self-obstacle prevention: don't penalize a panel for being on the upper roof it's standing on
            if (ob.isUpperRoof && pos.isUpperRoof && isInside) return;

            const xs = ob.points.map(pt => pt.x), zs = ob.points.map(pt => pt.z);
            const b = { minX: Math.min(...xs) - 0.5, maxX: Math.max(...xs) + 0.5, minZ: Math.min(...zs) - 0.5, maxZ: Math.max(...zs) + 0.5 };
            const dx = Math.max(b.minX - pos.x, 0, pos.x - b.maxX);
            const dz = Math.max(b.minZ - pos.z, 0, pos.z - b.maxZ);
            const dist = Math.sqrt(dx * dx + dz * dz);
            if (dist < minDist) minDist = dist;
          });
          // Bonus: Upper roof panels get priority
          pos.sunScore = minDist + (pos.z * 0.1) + (pos.isUpperRoof ? 10 : 0); 
        });

        // 4. Sort and apply limit
        possiblePositions.sort((a, b) => b.sunScore - a.sunScore);
        const finalPositions = possiblePositions.slice(0, remainingPanels);

        // 5. Generate Meshes
        const panelGroup = new THREE.Group();
        const panelTexture = createSolarPanelTexture();
        const frameMat = new THREE.LineBasicMaterial({ color: 0xc0c8d0 });

        finalPositions.forEach(pos => {
          const geo = new THREE.PlaneGeometry(pos.pw, pos.ph);
          const mat = new THREE.MeshStandardMaterial({ map: panelTexture, color: 0x1a3a6e, roughness: 0.1, metalness: 0.3, side: THREE.DoubleSide });
          const panel = new THREE.Mesh(geo, mat);
          const rearEdgeLift = (pos.ph / 2) * Math.sin(PANEL_TILT_RAD);

          panel.position.set(pos.x, pos.y + rearEdgeLift, pos.z);
          panel.rotation.order = "YXZ";
          panel.rotation.y = -ROOF_AZIMUTH_RAD;
          panel.rotation.x = Math.PI / 2 - PANEL_TILT_RAD;
          panel.castShadow = true; panel.receiveShadow = true; panel.userData.isPanel = true;
          panelGroup.add(panel);
          
          const frame = new THREE.LineSegments(new THREE.EdgesGeometry(geo), frameMat);
          frame.position.set(0, 0.002, 0); panel.add(frame);
          allPanelMeshes.push(panel);
        });

        scene.add(panelGroup);
        allPositions = finalPositions;
        totalPanelCount = finalPositions.length;
        orientationRef.current = mainGrid.orientation; // fallback
        
        console.log(`✅ Global Auto-grid: ${totalPanelCount} active panels (Max Capacity: ${physicalMaxCapacity})`);
      }

      panelMeshesRef.current = allPanelMeshes;
      panelCountRef.current = totalPanelCount;
      panelPositionsRef.current = allPositions;
      shadowCasterCacheRef.current = buildShadowCasterCache(scene);

      const financial = getMonthlySavings(totalPanelCount);
      financialRef.current = financial;
      console.log(
        `| ${((totalPanelCount * PANEL_RATED_W) / 1000).toFixed(1)} kWp | ₹${
          financial.monthlySavings
        }/mo`
      );

      createRealisticGround(scene);
      createDistantTrees(scene, siteData.roof_polygon, "/tree.glb");
      const { cloudGroup, timeUniform } = createClouds(scene);
      cloudGroupRef.current = cloudGroup;
      cloudTimeRef.current = timeUniform;

      const grid = new THREE.GridHelper(80, 40, 0x2a3a20, 0x1e2e14);
      grid.position.y = 0.005;
      grid.material.opacity = 0.18;
      grid.material.transparent = true;
      scene.add(grid);

      const avgX =
        siteData.roof_polygon.reduce((s, p) => s + p.x, 0) /
        siteData.roof_polygon.length;
      const avgZ =
        siteData.roof_polygon.reduce((s, p) => s + p.z, 0) /
        siteData.roof_polygon.length;
      const camera = new THREE.PerspectiveCamera(
        60,
        getW() / getH(),
        0.1,
        1000
      );
      camera.position.set(avgX + 16, 14, avgZ + 16);
      camera.lookAt(avgX, 0, avgZ);

      const controls = new OrbitControls(camera, renderer.domElement);
      renderer.domElement.style.touchAction = "none";
      controls.enableDamping = true;
      controls.dampingFactor = 0.06;
      controls.minDistance = 5;
      controls.maxDistance = 80;
      controls.maxPolarAngle = Math.PI / 2 - 0.05;
      controls.target.set(avgX, 0, avgZ);
      controls.enablePan = true;
      controls.touches = {
        ONE: THREE.TOUCH.ROTATE,
        TWO: THREE.TOUCH.DOLLY_PAN,
      };

      const noon = new Date();
      noon.setHours(12, 0, 0, 0);
      updateSunToDate(noon);
      setLoadState("ready");

      const interval = setInterval(() => {
        if (isRealtimeRef.current) updateSunToDate(new Date());
      }, 60000);

      const handleResize = () => {
        if (!canvasRef.current) return;
        const w = getW(),
          h = getH();
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      };
      window.addEventListener("resize", handleResize);
      const ro = new ResizeObserver(handleResize);
      ro.observe(container);

      let animId,
        lastTime = 0;
      function animate(timestamp) {
        animId = requestAnimationFrame(animate);
        controls.update();
        const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
        lastTime = timestamp;
        if (cloudTimeRef.current) cloudTimeRef.current.value += dt;
        if (cloudGroupRef.current)
          cloudGroupRef.current.children.forEach((cloud, i) => {
            cloud.position.x += dt * (0.35 + (i % 4) * 0.15);
            if (cloud.position.x > 200) cloud.position.x = -200;
          });
        renderer.render(scene, camera);
      }
      animate(0);

      return () => {
        cancelAnimationFrame(animId);
        clearInterval(interval);
        window.removeEventListener("resize", handleResize);
        ro.disconnect();
        renderer.dispose();
        pmremGenerator.dispose();
        if (renderTargetRef.current) renderTargetRef.current.dispose();
      };
    } catch (err) {
      console.error("Three.js init error:", err);
      setLoadError([err.message || "3D engine failed"]);
      setLoadState("error");
    }
  }, [updateSunToDate, propSiteData, panelOverride, sanctionedLoadKW]); // 👈 Added sanctionedLoadKW dependency

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        background: "#050f23",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          display: "block",
          touchAction: "none",
          width: "100%",
          height: "100%",
        }}
      />
      {loadState === "loading" && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "#050f23",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            gap: 16,
            color: "#4fc3f7",
            fontFamily: "monospace",
            zIndex: 10,
          }}
        >
          <div style={{ fontSize: 32 }}>☀️</div>
          <div style={{ fontSize: 12, letterSpacing: 3 }}>
            ANALYZING ROOF...
          </div>
          <div
            style={{
              width: 160,
              height: 3,
              background: "rgba(79,195,247,0.2)",
              borderRadius: 2,
            }}
          >
            <div
              style={{
                width: "60%",
                height: "100%",
                background: "#4fc3f7",
                borderRadius: 2,
                animation: "loading-bar 1.5s ease-in-out infinite",
              }}
            />
          </div>
          <style>{`@keyframes loading-bar{0%{width:10%}50%{width:80%}100%{width:10%}}`}</style>
        </div>
      )}
      {loadState === "error" && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "#050f23",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontFamily: "monospace",
            padding: 24,
            zIndex: 10,
          }}
        >
          <div style={{ fontSize: 36, marginBottom: 12 }}>⚠️</div>
          <div style={{ color: "#ff4444", fontSize: 16, marginBottom: 10 }}>
            Site Data Error
          </div>
          {loadError.map((e, i) => (
            <div
              key={i}
              style={{ color: "#ff8888", fontSize: 12, marginBottom: 4 }}
            >
              • {e}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RoofCanva;