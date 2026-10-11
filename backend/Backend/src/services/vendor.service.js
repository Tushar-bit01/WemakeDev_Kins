const crypto = require('crypto');
const VendorModel = require('../models/vendor.model');
const { pool } = require('../config/database');
const logger = require('../utils/logger');

class VendorService {

    static generateRegistrationToken() {
        return crypto.randomBytes(32).toString('hex');
    }

    static buildRegistrationLink(registrationToken) {
        const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        return `${baseUrl}/register/customer/${registrationToken}`;
    }

    static async getVendorProfile(vendorId) {
        const vendor = await VendorModel.findById(vendorId);
        if (!vendor) return null;
        return { ...vendor, registration_link: VendorService.buildRegistrationLink(vendor.registration_token) };
    }

    static async resolveVendorToken(token) {
        const vendor = await VendorModel.findByToken(token);
        if (!vendor) return null;
        return {
            vendor_id:             vendor.id,
            company_name:          vendor.company_name,
            state:                 vendor.state,
            discom:                vendor.discom,
            default_panel_wattage: vendor.default_panel_wattage,
        };
    }

    static async handleCustomerSubmission({ vendorId, username, email, mobileNumber, locationAddress, lat, lng, loadKw }) {
        const vendor = await VendorModel.findById(vendorId);
        if (!vendor || !vendor.is_active) throw new Error('Vendor not found or inactive');

        const submission = await VendorModel.createSubmission({
            vendorId, username, email, mobileNumber, locationAddress, lat, lng, loadKw,
        });
        const updated = await VendorModel.updateSubmissionStatus(submission.id, 'notified');

        logger.info(`Customer submission: submission_id=${submission.id} vendor_id=${vendorId} email=${email}`);
        return updated;
    }

    static async getVendorSubmissions(vendorId) {
        return VendorModel.findSubmissionsByVendor(vendorId);
    }

    static async getVendorCustomers(vendorId) {
        const CustomerModel = require('../models/customer.model');
        return CustomerModel.findByVendorId(vendorId);
    }
}

module.exports = VendorService;