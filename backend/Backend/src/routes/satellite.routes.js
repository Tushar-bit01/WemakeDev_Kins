const express = require('express');
const router = express.Router();
const { jwtCheck } = require('../middleware/auth');
const { getSatelliteImage } = require('../controllers/satellite.controller');
const { validateSatellite } = require('../middleware/validate');


router.post('/satellite', jwtCheck, validateSatellite, getSatelliteImage);

module.exports = router;