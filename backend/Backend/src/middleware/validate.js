const { z } = require('zod');

// Validate POST /api/satellite
const satelliteSchema = z.object({
    address: z.string().min(3).optional(),
    lat: z.coerce.number().min(-90).max(90).optional(),
    lng: z.coerce.number().min(-180).max(180).optional(),
}).refine(data => data.address || (data.lat !== undefined && data.lng !== undefined), {
    message: "Provide either an address or lat/lng coordinates",
    path: ['address']
});

// Validate POST /audit/start
const auditStartSchema = z.object({
    address: z.string().min(3).optional(),
    lat: z.coerce.number().min(-90).max(90).optional(),
    lng: z.coerce.number().min(-180).max(180).optional(),
    owner_name: z.string().min(1, "Owner name is required"),
    owner_email: z.string().email("Invalid email address"),
    owner_phone: z.string().min(7, "Invalid phone number"),
}).refine(data => data.address || (data.lat !== undefined && data.lng !== undefined), {
    message: "Provide either an address or lat/lng coordinates",
    path: ['address']
});

// Validate POST /webhooks/ai-results
const aiResultsSchema = z.object({
    audit_id: z.number().int().positive("audit_id must be a positive integer"),
    solar_system_size: z.number().positive().optional(),
    roi_estimate: z.number().positive().optional(),
    status: z.enum(['completed', 'failed']),
});

// Middleware factory
const validate = (schema) => (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
        // zod v3+ uses .issues, fallback to .errors for older versions
        const issues = result.error?.issues || result.error?.errors || [];
        const errors = issues.map(e => ({
            field: e.path.length > 0 ? e.path.join('.') : 'request',
            message: e.message
        }));

        return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors
        });
    }
    req.body = result.data;
    next();
};

module.exports = {
    validateSatellite: validate(satelliteSchema),
    validateAuditStart: validate(auditStartSchema),
    validateAiResults: validate(aiResultsSchema),
};