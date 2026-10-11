-- =============================================================================
-- Kins — Master Database Schema
-- =============================================================================
-- Run order matters: tables are defined before their dependants.
-- All timestamps are WITHOUT TIME ZONE and stored in UTC.
-- Custom JWT auth — passwords are stored as bcrypt hashes.
-- =============================================================================


-- =============================================================================
-- UTILITY: auto-update updated_at on every UPDATE
-- =============================================================================

CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- =============================================================================
-- USERS
-- Regular homeowners who use the platform directly (not via vendor invite)
-- =============================================================================

CREATE TABLE IF NOT EXISTS users (
  id              SERIAL PRIMARY KEY,
  username        VARCHAR(50)  NOT NULL UNIQUE,
  email           TEXT         NOT NULL UNIQUE,
  password_hash   VARCHAR(255) NOT NULL,
  mobile          VARCHAR(20),
  address         TEXT,
  lat             NUMERIC(10, 7),
  lng             NUMERIC(10, 7),
  sanctioned_load VARCHAR(20),
  image_path      TEXT,
  created_at      TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  updated_at      TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email    ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

CREATE OR REPLACE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();


-- =============================================================================
-- VENDORS
-- Solar installers / businesses who manage customers
-- =============================================================================

CREATE TABLE IF NOT EXISTS vendors (
  id                        SERIAL PRIMARY KEY,
  username                  VARCHAR(50)  NOT NULL,
  password_hash             VARCHAR(255) NOT NULL,
  email                     TEXT         NOT NULL UNIQUE,
  mobile                    VARCHAR(20)  NOT NULL,
  company_name              TEXT         NOT NULL,
  contact_name              TEXT,
  state                     TEXT         NOT NULL,
  discom                    TEXT         NOT NULL,
  city                      TEXT,
  pincode                   TEXT,
  default_panel_wattage     VARCHAR(20),
  gst_number                TEXT         NOT NULL,
  national_portal_vendor_id TEXT         NOT NULL,
  service_area              TEXT,
  years_active              TEXT,
  team_size                 TEXT,
  avg_install_kw            TEXT,
  avatar                    VARCHAR(50)  DEFAULT 'vav1',
  photo                     TEXT,
  registration_token        TEXT         UNIQUE,
  is_active                 BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at                TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  updated_at                TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vendors_email              ON vendors(email);
CREATE INDEX IF NOT EXISTS idx_vendors_username           ON vendors(username);
CREATE INDEX IF NOT EXISTS idx_vendors_registration_token ON vendors(registration_token);
CREATE INDEX IF NOT EXISTS idx_vendors_is_active          ON vendors(is_active);

CREATE OR REPLACE TRIGGER trg_vendors_updated_at
  BEFORE UPDATE ON vendors
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();


-- =============================================================================
-- CUSTOMERS
-- Standalone customer entity — vendor-invited users
-- Has own auth (email + password_hash), site editor data, finalized design
-- =============================================================================

CREATE TABLE IF NOT EXISTS customers (
  id                SERIAL PRIMARY KEY,

  -- Auth
  username          VARCHAR(50)  NOT NULL,
  email             TEXT         NOT NULL UNIQUE,
  password_hash     VARCHAR(255) NOT NULL,

  -- Profile
  name              TEXT,
  mobile            VARCHAR(20),
  sanctioned_load   NUMERIC,
  address           TEXT,
  city              TEXT,
  pincode           TEXT,
  avatar            VARCHAR(50)  DEFAULT 'cav1',
  photo             TEXT,

  -- Linked vendor (set on signup via invite link)
  vendor_id         INTEGER      REFERENCES vendors(id) ON DELETE SET NULL,

  -- Site editor data
  load_kw           NUMERIC,
  monthly_bill      NUMERIC,
  state             TEXT,
  discom            TEXT,
  site_data         JSONB,
  panel_override    JSONB,
  finalized_design  JSONB,
  finalized_at      TIMESTAMP WITHOUT TIME ZONE,
  submitted_at      TIMESTAMP WITHOUT TIME ZONE,

  -- Satellite image
  image_path        TEXT,

  -- Status
  status            TEXT         NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active', 'pending', 'inactive')),

  -- Activity
  last_active_at    TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  created_at        TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  updated_at        TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customers_email     ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_username  ON customers(username);
CREATE INDEX IF NOT EXISTS idx_customers_vendor_id ON customers(vendor_id);
CREATE INDEX IF NOT EXISTS idx_customers_status    ON customers(status);

CREATE OR REPLACE TRIGGER trg_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();


-- =============================================================================
-- PLANS
-- =============================================================================

CREATE TABLE IF NOT EXISTS plans (
  id          SERIAL PRIMARY KEY,
  plan_name   TEXT           NOT NULL UNIQUE,
  entity_type TEXT           NOT NULL
                CHECK (entity_type IN ('user', 'vendor', 'customer')),
  price       NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  currency    TEXT           NOT NULL DEFAULT 'INR',
  description TEXT,
  is_active   BOOLEAN        NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

INSERT INTO plans (plan_name, entity_type, price, description) VALUES
  ('pinnacle', 'user',   299.00,   'Pinnacle plan for individual users'),
  ('basic',    'vendor', 49000.00, 'Basic plan for solar vendors'),
  ('standard', 'vendor', 59000.00, 'Standard plan for solar vendors'),
  ('gold',     'vendor', 69000.00, 'Gold plan for solar vendors')
ON CONFLICT (plan_name) DO NOTHING;


-- =============================================================================
-- PAYMENTS
-- =============================================================================

CREATE TABLE IF NOT EXISTS payments (
  id                   SERIAL PRIMARY KEY,
  user_id              INTEGER        REFERENCES users(id)     ON DELETE SET NULL,
  vendor_id            INTEGER        REFERENCES vendors(id)   ON DELETE SET NULL,
  customer_id          INTEGER        REFERENCES customers(id) ON DELETE SET NULL,
  plan_id              INTEGER        REFERENCES plans(id)     ON DELETE SET NULL,
  razorpay_order_id    TEXT           NOT NULL UNIQUE,
  razorpay_payment_id  TEXT           UNIQUE,
  amount               NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
  currency             TEXT           NOT NULL DEFAULT 'INR',
  status               TEXT           NOT NULL
                         CHECK (status IN ('created', 'verified', 'failed'))
                         DEFAULT 'created',
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_user_id           ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_vendor_id         ON payments(vendor_id);
CREATE INDEX IF NOT EXISTS idx_payments_customer_id       ON payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_razorpay_order_id ON payments(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_payments_status            ON payments(status);

CREATE OR REPLACE TRIGGER trg_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();


-- =============================================================================
-- USER LOCATIONS
-- =============================================================================

CREATE TABLE IF NOT EXISTS user_locations (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lat        NUMERIC(10, 7) NOT NULL,
  lng        NUMERIC(10, 7) NOT NULL,
  image_path TEXT,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_locations_user_id ON user_locations(user_id);


-- =============================================================================
-- AUDITS
-- =============================================================================

CREATE TABLE IF NOT EXISTS audits (
  id                SERIAL PRIMARY KEY,
  user_id           INTEGER        REFERENCES users(id)     ON DELETE SET NULL,
  vendor_id         INTEGER        REFERENCES vendors(id)   ON DELETE SET NULL,
  customer_id       INTEGER        REFERENCES customers(id) ON DELETE SET NULL,
  property_address  TEXT           NOT NULL,
  lat               NUMERIC(10, 7),
  lng               NUMERIC(10, 7),
  image_path        TEXT,
  owner_name        TEXT,
  owner_email       TEXT,
  owner_phone       TEXT,
  solar_system_size NUMERIC(10, 2),
  roi_estimate      NUMERIC(10, 2),
  status            TEXT NOT NULL
    CHECK (status IN ('pending', 'processing', 'completed', 'failed'))
    DEFAULT 'pending',
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audits_user_id     ON audits(user_id);
CREATE INDEX IF NOT EXISTS idx_audits_vendor_id   ON audits(vendor_id);
CREATE INDEX IF NOT EXISTS idx_audits_customer_id ON audits(customer_id);
CREATE INDEX IF NOT EXISTS idx_audits_status      ON audits(status);

CREATE OR REPLACE TRIGGER trg_audits_updated_at
  BEFORE UPDATE ON audits
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();


-- =============================================================================
-- VENDOR CUSTOMER SUBMISSIONS
-- =============================================================================

CREATE TABLE IF NOT EXISTS vendor_customer_submissions (
  id               SERIAL PRIMARY KEY,
  vendor_id        INTEGER NOT NULL REFERENCES vendors(id)   ON DELETE CASCADE,
  customer_id      INTEGER          REFERENCES customers(id) ON DELETE SET NULL,
  username         TEXT           NOT NULL,
  email            TEXT           NOT NULL,
  mobile_number    TEXT           NOT NULL,
  location_address TEXT,
  lat              NUMERIC(10, 7),
  lng              NUMERIC(10, 7),
  load_kw          NUMERIC(6, 2)  CHECK (load_kw > 0),
  audit_id         INTEGER        REFERENCES audits(id) ON DELETE SET NULL,
  status           TEXT NOT NULL
    CHECK (status IN ('submitted', 'notified', 'analysing', 'completed', 'cancelled'))
    DEFAULT 'submitted',
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vcs_vendor_id   ON vendor_customer_submissions(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vcs_email       ON vendor_customer_submissions(email);
CREATE INDEX IF NOT EXISTS idx_vcs_status      ON vendor_customer_submissions(status);
CREATE INDEX IF NOT EXISTS idx_vcs_customer_id ON vendor_customer_submissions(customer_id);
CREATE INDEX IF NOT EXISTS idx_vcs_audit_id    ON vendor_customer_submissions(audit_id);

CREATE OR REPLACE TRIGGER trg_vcs_updated_at
  BEFORE UPDATE ON vendor_customer_submissions
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();


-- =============================================================================
-- PASSWORD RESET TOKENS
-- =============================================================================

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id         SERIAL PRIMARY KEY,
  email      TEXT        NOT NULL,
  role       TEXT        NOT NULL CHECK (role IN ('vendor', 'user', 'customer')),
  token      TEXT        NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used       BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (email, role)
);

CREATE INDEX IF NOT EXISTS idx_prt_token ON password_reset_tokens(token);


-- =============================================================================
-- TOKEN BLACKLIST
-- =============================================================================

CREATE TABLE IF NOT EXISTS token_blacklist (
  id         SERIAL PRIMARY KEY,
  token      TEXT        NOT NULL UNIQUE,
  role       TEXT        NOT NULL CHECK (role IN ('vendor', 'user', 'customer')),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_token_blacklist_token ON token_blacklist(token);