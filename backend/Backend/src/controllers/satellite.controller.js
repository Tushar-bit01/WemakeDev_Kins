const { pool } = require('../config/database');
const logger = require('../utils/logger');
const { fetchAndProcessImage, resolveCoordinates } = require('../services/satellite.service');

// POST /satellite — roof preview, saves to user_locations (no audit created)
exports.getSatelliteImage = async (req, res) => {
    try {
        const { lat, lng, resolvedAddress } = await resolveCoordinates(req.body);
        const { imagePath, finalX, finalY } = await fetchAndProcessImage(lat, lng);

        // Persist location if request is authenticated as a user
        const sub = req.auth?.payload?.sub;
        if (sub?.startsWith('user:')) {
            const userId = parseInt(sub.split(':')[1], 10);
            if (userId) {
                await pool.query(
                    'INSERT INTO user_locations (user_id, lat, lng, image_path) VALUES ($1, $2, $3, $4)',
                    [userId, lat, lng, imagePath]
                );
            }
        }

        return res.status(200).json({
            success: true,
            lat,
            lng,
            resolvedAddress,
            coordinates: { x: finalX, y: finalY },
            imagePath,
        });
    } catch (error) {
        if (error.statusCode) return res.status(error.statusCode).json({ success: false, message: error.message });
        logger.error('Satellite image error', { error: error.message, stack: error.stack });
        return res.status(500).json({ success: false, message: 'Something went wrong' });
    }
};