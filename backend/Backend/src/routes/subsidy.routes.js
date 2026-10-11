// Subsidy routes — no auth required (public data for dropdown + estimation)

const express = require('express');
const router = express.Router();
const SubsidyController = require('../controllers/subsidy.controller');

// GET /api/subsidy/states
// All Indian states with DISCOM list — for registration form dropdown
router.get('/states', SubsidyController.getAllStates);

// GET /api/subsidy/states/:stateCode
// Single state info (DISCOMs, net metering status)
router.get('/states/:stateCode', SubsidyController.getStateInfo);

// GET /api/subsidy/calculate?state=GJ&systemSizeKw=3
// Full PM Surya Ghar subsidy breakdown
router.get('/calculate', SubsidyController.calculateSubsidy);

module.exports = router;