// This file handles HTTP layer for all subsidy-related endpoints

const SubsidyService = require('../services/subsidy.service');
const logger = require('../utils/logger');

class SubsidyController {

  // GET /api/subsidy/states
  // Returns all states with their DISCOMs — used to populate the State & DISCOM dropdown
  static getAllStates(req, res, next) {
    try {
      const states = SubsidyService.getAllStates();
      return res.status(200).json({
        success: true,
        count: states.length,
        data: states,
      });
    } catch (error) {
      logger.error('SubsidyController.getAllStates error:', error);
      next(error);
    }
  }

  // GET /api/subsidy/states/:stateCode
  // Returns a single state's DISCOM list and net metering status
  static getStateInfo(req, res, next) {
    try {
      const { stateCode } = req.params;
      const state = SubsidyService.getStateByCode(stateCode);

      if (!state) {
        return res.status(404).json({
          success: false,
          error: `State with code '${stateCode}' not found`,
        });
      }

      return res.status(200).json({
        success: true,
        data: state,
      });
    } catch (error) {
      logger.error('SubsidyController.getStateInfo error:', error);
      next(error);
    }
  }

  // GET /api/subsidy/calculate?state=GJ&systemSizeKw=3
  // Returns full subsidy breakdown for a given state + system size
  static calculateSubsidy(req, res, next) {
    try {
      const { state, systemSizeKw } = req.query;

      if (!state) {
        return res.status(400).json({
          success: false,
          error: 'Query param "state" is required (e.g. ?state=GJ)',
        });
      }

      if (!systemSizeKw) {
        return res.status(400).json({
          success: false,
          error: 'Query param "systemSizeKw" is required (e.g. ?systemSizeKw=3)',
        });
      }

      const sizeKw = parseFloat(systemSizeKw);
      if (isNaN(sizeKw) || sizeKw <= 0) {
        return res.status(400).json({
          success: false,
          error: '"systemSizeKw" must be a positive number',
        });
      }

      const result = SubsidyService.calculateSubsidy(state, sizeKw);

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      // Service throws for invalid state code
      if (error.message.startsWith('Invalid state code')) {
        return res.status(400).json({
          success: false,
          error: error.message,
        });
      }
      logger.error('SubsidyController.calculateSubsidy error:', error);
      next(error);
    }
  }
}

module.exports = SubsidyController;