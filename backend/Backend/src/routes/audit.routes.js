const express = require('express');
const router = express.Router();
const { jwtCheck } = require('../middleware/auth');
const { startAudit, getAuditStatus, receiveAiResults, receiveRoofResults } = require('../controllers/audit.controller');
const { validateAuditStart, validateAiResults } = require('../middleware/validate');


router.post('/start', jwtCheck, validateAuditStart, startAudit);
router.get('/status/:id', jwtCheck, getAuditStatus);
router.post('/webhooks/ai-results', validateAiResults, receiveAiResults);
router.post('/webhooks/roof-results', receiveRoofResults);



module.exports = router;