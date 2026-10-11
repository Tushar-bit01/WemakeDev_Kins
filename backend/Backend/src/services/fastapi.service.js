// Backend\src\services\fastapi.service.js
const axios = require('axios');
const logger = require('../utils/logger');

const sendToFastAPI = async ({ imageUrl, lat, lng, customerId, entityType, coordinates }) => {
  try {
    await axios.post(`${process.env.FASTAPI_URL}/analyze-roof`, {
      success: true,
      lat,
      lng,
      imagePath: imageUrl,
      customer_id: customerId,
      entity_type: entityType,
      coordinates: {
        x: coordinates?.x ?? null,
        y: coordinates?.y ?? null,
      },
    }, {
      timeout: 60000,
      headers: { 'Content-Type': 'application/json' },
    });
    logger.info(`Sent to FastAPI: customer_id=${customerId} entity_type=${entityType} pixel=(${coordinates?.x}, ${coordinates?.y})`);
  } catch (err) {
    logger.warn(`FastAPI call failed: ${err.message} — ${err.code || ''}`);
  }
};

module.exports = { sendToFastAPI };