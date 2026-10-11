// src/middleware/vendor.validation.js
const { z } = require('zod');

// No longer used for vendor registration (handled by auth.controller.js)
// Kept for reference only
const vendorRegistrationSchema = z.object({
  username:                   z.string().min(2).max(50),
  company_name:               z.string().min(2).max(200),
  email:                      z.string().email(),
  password:                   z.string().min(8).max(128),
  mobile:                     z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number').optional(),
  state:                      z.string().min(2).max(100).optional(),
  discom:                     z.string().min(2).max(100).optional(),
  default_panel_wattage:      z.string().optional(),
  gst_number:                 z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GST number').optional().or(z.literal('')),
  national_portal_vendor_id:  z.string().max(100).optional(),
});

// Used in POST /api/vendor/link/:token/submit
const customerSubmissionSchema = z.object({
  username:         z.string().min(2).max(100),
  email:            z.string().email(),
  mobile_number:    z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number'),
  location_address: z.string().max(500).optional(),
  lat:              z.number().min(-90).max(90).optional(),
  lng:              z.number().min(-180).max(180).optional(),
  load_kw:          z.number().positive().max(1000).optional(),
});

module.exports = {
  vendorRegistrationSchema,
  customerSubmissionSchema,
};