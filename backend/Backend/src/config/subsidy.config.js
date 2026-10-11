// PM Surya Ghar Muft Bijli Yojana - Central subsidy slabs
// Source: MNRE notification, updated 2024
// Central subsidy is uniform across India; state top-ups vary

const CENTRAL_SUBSIDY_SLABS = [
  { minKw: 0,   maxKw: 1,   subsidyPerKw: 30000, maxSubsidy: 30000  },
  { minKw: 1,   maxKw: 2,   subsidyPerKw: 18000, maxSubsidy: 60000  }, // 30k for 1st kW + 18k for 2nd
  { minKw: 2,   maxKw: 3,   subsidyPerKw: 9000,  maxSubsidy: 78000  }, // flat 9k above 2kW, capped at 3kW
  { minKw: 3,   maxKw: Infinity, subsidyPerKw: 0, maxSubsidy: 78000 }, // no additional subsidy beyond 3kW
];

// Calculate central subsidy for a given system size
function calculateCentralSubsidy(systemSizeKw) {
  let subsidy = 0;

  if (systemSizeKw <= 0) return 0;

  if (systemSizeKw <= 1) {
    subsidy = systemSizeKw * 30000;
  } else if (systemSizeKw <= 2) {
    subsidy = 30000 + (systemSizeKw - 1) * 18000;
  } else if (systemSizeKw <= 3) {
    subsidy = 30000 + 18000 + (systemSizeKw - 2) * 9000;
  } else {
    subsidy = 78000; // Capped at 3kW equivalent
  }

  return Math.round(subsidy);
}

// State-wise DISCOMs and state top-up subsidies
// net_metering: whether net metering is available
// state_subsidy_per_kw: additional state government subsidy (0 if none announced)
// discom_portal: official portal for net metering application
const STATE_DATA = {
  AN: {
    state: 'Andaman & Nicobar Islands',
    discoms: ['ANIIDCO'],
    net_metering: true,
    state_subsidy_per_kw: 0,
    discom_portal: 'https://aniidco.and.nic.in',
  },
  AP: {
    state: 'Andhra Pradesh',
    discoms: ['APSPDCL', 'APEPDCL'],
    net_metering: true,
    state_subsidy_per_kw: 10000,
    discom_portal: 'https://www.apeasternpower.com',
  },
  AR: {
    state: 'Arunachal Pradesh',
    discoms: ['APDCL'],
    net_metering: false,
    state_subsidy_per_kw: 0,
    discom_portal: null,
  },
  AS: {
    state: 'Assam',
    discoms: ['APDCL'],
    net_metering: true,
    state_subsidy_per_kw: 0,
    discom_portal: 'https://www.apdcl.org',
  },
  BR: {
    state: 'Bihar',
    discoms: ['NBPDCL', 'SBPDCL'],
    net_metering: true,
    state_subsidy_per_kw: 0,
    discom_portal: 'https://www.nbpdcl.co.in',
  },
  CG: {
    state: 'Chhattisgarh',
    discoms: ['CSPDCL'],
    net_metering: true,
    state_subsidy_per_kw: 0,
    discom_portal: 'https://www.cspdcl.co.in',
  },
  CH: {
    state: 'Chandigarh',
    discoms: ['Electricity Department Chandigarh'],
    net_metering: true,
    state_subsidy_per_kw: 5000,
    discom_portal: 'https://chdelectricity.in',
  },
  DD: {
    state: 'Dadra & Nagar Haveli and Daman & Diu',
    discoms: ['Department of Electricity'],
    net_metering: true,
    state_subsidy_per_kw: 0,
    discom_portal: null,
  },
  DL: {
    state: 'Delhi',
    discoms: ['BSES Rajdhani', 'BSES Yamuna', 'TPDDL'],
    net_metering: true,
    state_subsidy_per_kw: 2000,
    discom_portal: 'https://www.bsesdelhi.com',
  },
  GA: {
    state: 'Goa',
    discoms: ['GEDCOL'],
    net_metering: true,
    state_subsidy_per_kw: 0,
    discom_portal: 'https://goaelectricity.gov.in',
  },
  GJ: {
    state: 'Gujarat',
    discoms: ['UGVCL', 'MGVCL', 'PGVCL', 'DGVCL'],
    net_metering: true,
    state_subsidy_per_kw: 10000,
    discom_portal: 'https://www.ugvcl.com',
  },
  HR: {
    state: 'Haryana',
    discoms: ['UHBVN', 'DHBVN'],
    net_metering: true,
    state_subsidy_per_kw: 0,
    discom_portal: 'https://www.uhbvn.org.in',
  },
  HP: {
    state: 'Himachal Pradesh',
    discoms: ['HPSEBL'],
    net_metering: true,
    state_subsidy_per_kw: 15000,
    discom_portal: 'https://hpseb.in',
  },
  JK: {
    state: 'Jammu & Kashmir',
    discoms: ['JKPDCL', 'JKPDCL Jammu'],
    net_metering: true,
    state_subsidy_per_kw: 0,
    discom_portal: 'https://jkpdcl.in',
  },
  JH: {
    state: 'Jharkhand',
    discoms: ['JBVNL'],
    net_metering: true,
    state_subsidy_per_kw: 0,
    discom_portal: 'https://jbvnl.co.in',
  },
  KA: {
    state: 'Karnataka',
    discoms: ['BESCOM', 'MESCOM', 'HESCOM', 'GESCOM', 'CESC'],
    net_metering: true,
    state_subsidy_per_kw: 0,
    discom_portal: 'https://bescom.karnataka.gov.in',
  },
  KL: {
    state: 'Kerala',
    discoms: ['KSEB'],
    net_metering: true,
    state_subsidy_per_kw: 15000,
    discom_portal: 'https://kseb.in',
  },
  LD: {
    state: 'Lakshadweep',
    discoms: ['Electricity Department'],
    net_metering: false,
    state_subsidy_per_kw: 0,
    discom_portal: null,
  },
  MP: {
    state: 'Madhya Pradesh',
    discoms: ['MPPKVVCL', 'MPMKVVCL', 'MPWZVCL'],
    net_metering: true,
    state_subsidy_per_kw: 0,
    discom_portal: 'https://www.mpez.co.in',
  },
  MH: {
    state: 'Maharashtra',
    discoms: ['MSEDCL', 'Tata Power', 'Adani Electricity', 'BEST'],
    net_metering: true,
    state_subsidy_per_kw: 0,
    discom_portal: 'https://www.mahadiscom.in',
  },
  MN: {
    state: 'Manipur',
    discoms: ['MSPCL'],
    net_metering: false,
    state_subsidy_per_kw: 0,
    discom_portal: null,
  },
  ML: {
    state: 'Meghalaya',
    discoms: ['MePDCL'],
    net_metering: true,
    state_subsidy_per_kw: 0,
    discom_portal: 'https://mepdcl.in',
  },
  MZ: {
    state: 'Mizoram',
    discoms: ['Power & Electricity Department'],
    net_metering: false,
    state_subsidy_per_kw: 0,
    discom_portal: null,
  },
  NL: {
    state: 'Nagaland',
    discoms: ['DPNSED'],
    net_metering: false,
    state_subsidy_per_kw: 0,
    discom_portal: null,
  },
  OD: {
    state: 'Odisha',
    discoms: ['TPNODL', 'TPSODL', 'TPWODL', 'TPCODL'],
    net_metering: true,
    state_subsidy_per_kw: 0,
    discom_portal: 'https://www.tpnodl.in',
  },
  PY: {
    state: 'Puducherry',
    discoms: ['EDPDY'],
    net_metering: true,
    state_subsidy_per_kw: 0,
    discom_portal: null,
  },
  PB: {
    state: 'Punjab',
    discoms: ['PSPCL'],
    net_metering: true,
    state_subsidy_per_kw: 0,
    discom_portal: 'https://www.pspcl.in',
  },
  RJ: {
    state: 'Rajasthan',
    discoms: ['JVVNL', 'AVVNL', 'JDVVNL'],
    net_metering: true,
    state_subsidy_per_kw: 0,
    discom_portal: 'https://www.jaipurdiscom.com',
  },
  SK: {
    state: 'Sikkim',
    discoms: ['Energy & Power Department'],
    net_metering: false,
    state_subsidy_per_kw: 0,
    discom_portal: null,
  },
  TN: {
    state: 'Tamil Nadu',
    discoms: ['TANGEDCO'],
    net_metering: true,
    state_subsidy_per_kw: 0,
    discom_portal: 'https://www.tangedco.gov.in',
  },
  TS: {
    state: 'Telangana',
    discoms: ['TSSPDCL', 'TSNPDCL'],
    net_metering: true,
    state_subsidy_per_kw: 0,
    discom_portal: 'https://www.tssouthernpower.com',
  },
  TR: {
    state: 'Tripura',
    discoms: ['TSECL'],
    net_metering: true,
    state_subsidy_per_kw: 0,
    discom_portal: 'https://tsecl.in',
  },
  UP: {
    state: 'Uttar Pradesh',
    discoms: ['DVVNL', 'MVVNL', 'PVVNL', 'PuVVNL', 'KESCO'],
    net_metering: true,
    state_subsidy_per_kw: 0,
    discom_portal: 'https://www.dvvnl.org',
  },
  UK: {
    state: 'Uttarakhand',
    discoms: ['UPCL'],
    net_metering: true,
    state_subsidy_per_kw: 0,
    discom_portal: 'https://www.upcl.org',
  },
  WB: {
    state: 'West Bengal',
    discoms: ['WBSEDCL', 'CESC'],
    net_metering: true,
    state_subsidy_per_kw: 0,
    discom_portal: 'https://www.wbsedcl.in',
  },
};

module.exports = {
  CENTRAL_SUBSIDY_SLABS,
  STATE_DATA,
  calculateCentralSubsidy,
};