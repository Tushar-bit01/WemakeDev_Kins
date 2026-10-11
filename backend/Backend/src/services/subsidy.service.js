// This file handles all PM Surya Ghar subsidy calculation logic

const {
  STATE_DATA,
  calculateCentralSubsidy,
} = require('../config/subsidy.config');

class SubsidyService {

  // Get all states with their DISCOMs (for dropdown population)
  static getAllStates() {
    return Object.entries(STATE_DATA).map(([code, data]) => ({
      code,
      state: data.state,
      discoms: data.discoms,
      net_metering: data.net_metering,
    }));
  }

  // Get a single state's info by state code
  static getStateByCode(stateCode) {
    const data = STATE_DATA[stateCode.toUpperCase()];
    if (!data) return null;
    return { code: stateCode.toUpperCase(), ...data };
  }

  // Calculate full subsidy breakdown for a given state + system size
  static calculateSubsidy(stateCode, systemSizeKw) {
    const state = STATE_DATA[stateCode.toUpperCase()];
    if (!state) {
      throw new Error(`Invalid state code: ${stateCode}`);
    }

    if (!systemSizeKw || systemSizeKw <= 0) {
      throw new Error('System size must be greater than 0 kW');
    }

    const centralSubsidy = calculateCentralSubsidy(systemSizeKw);

    // State subsidy is per kW, capped at system size (no upper limit specified unless overridden)
    const stateSubsidy = Math.round(state.state_subsidy_per_kw * Math.min(systemSizeKw, 10));

    const totalSubsidy = centralSubsidy + stateSubsidy;

    return {
      state_code: stateCode.toUpperCase(),
      state_name: state.state,
      system_size_kw: systemSizeKw,
      central_subsidy_inr: centralSubsidy,
      state_subsidy_inr: stateSubsidy,
      total_subsidy_inr: totalSubsidy,
      net_metering_available: state.net_metering,
      discom_portal: state.discom_portal,
      note: systemSizeKw > 3
        ? 'Central subsidy is capped at 3 kW (₹78,000 max). System size above 3 kW gets no additional central subsidy.'
        : null,
    };
  }
}

module.exports = SubsidyService;