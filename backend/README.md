# Kins — Backend

Backend for Kins, a B2B2C SaaS platform connecting homeowners with verified solar vendors in India. This service handles authentication, vendor-customer matching, satellite-based roof analysis orchestration, and payments.

## Tech Stack

- **Runtime:** Node.js, Express.js
- **Databases:** PostgreSQL (primary), MongoDB
- **Auth:** Custom JWT (HS256), role-encoded subject claims (`vendor:id`, `customer:id`, `user:id`)
- **Storage:** Cloudflare R2 (satellite imagery)
- **Geospatial:** Mapbox + Sharp (image processing)
- **Payments:** Razorpay
- **AI Integration:** Async FastAPI microservice via webhooks (roof analysis)

## Architecture

- Stateless JWT auth with server-side token blacklisting for revocation
- Satellite image capture pipeline: Mapbox → Sharp (processing) → Cloudflare R2 (storage)
- Roof analysis is offloaded to a separate FastAPI service; results return via webhook rather than blocking the request
- Password reset flow via Resend

## Status

Actively developed. Built and maintained solo as backend owner for Kins.
