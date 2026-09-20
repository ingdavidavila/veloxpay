-- VeloxPay database schema
--
-- Derived from the queries in server/routes/*.js and server/utils/*.js,
-- NOT from the markdown docs at the repo root -- those are stale (see
-- notes at the bottom of this file).
--
-- Usage:
--   createdb veloxpay
--   psql -d veloxpay -f server/schema.sql
--
-- Safe to re-run: every statement is guarded with IF NOT EXISTS.

-- gen_random_uuid() lives in pgcrypto on PG < 13; built in from 13 onward.
-- Harmless either way. The app generates its own UUIDs with uuidv4() and
-- passes them explicitly, so these defaults are only a fallback.
CREATE EXTENSION IF NOT EXISTS pgcrypto;


-- ============================================================
-- users  (routes/auth.js)
-- ============================================================
-- password_hash is nullable on purpose: OAuth accounts have no password.
-- handleLogin checks google_id/apple_id to reject password login on those.
CREATE TABLE IF NOT EXISTS users (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name               VARCHAR(255),
  business_name      VARCHAR(255),
  email              VARCHAR(255) UNIQUE NOT NULL,
  phone_number       VARCHAR(50),
  bank_account       VARCHAR(255),
  password_hash      VARCHAR(255),
  google_id          VARCHAR(255) UNIQUE,
  apple_id           VARCHAR(255) UNIQUE,
  avatar             TEXT,
  reset_token        VARCHAR(255),
  reset_token_expiry TIMESTAMP,
  created_at         TIMESTAMP DEFAULT NOW(),
  updated_at         TIMESTAMP DEFAULT NOW()
);

-- Login matches on LOWER(TRIM(email)); this index makes that lookup sargable.
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_lower
  ON users (LOWER(TRIM(email)));


-- ============================================================
-- suppliers  (routes/auth.js, routes/plaid.js)
-- ============================================================
-- One row is created per user at signup / first social login.
-- Bank fields are populated by the Plaid link exchange.
CREATE TABLE IF NOT EXISTS suppliers (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID REFERENCES users(id) ON DELETE CASCADE,
  name               VARCHAR(255),
  business_name      VARCHAR(255),
  email              VARCHAR(255),
  plaid_access_token TEXT,
  plaid_account_id   TEXT,
  plaid_metadata     JSONB,
  bank_connected     BOOLEAN DEFAULT FALSE,
  bank_connected_at  TIMESTAMP,
  created_at         TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_suppliers_user_id ON suppliers (user_id);


-- ============================================================
-- customers  (routes/invoices.js, utils/cronJobs.js)
-- ============================================================
-- The invoice "client". Exposed by GET /api/invoices/clients, which
-- selects id, name, email, phone.
-- supplier_id scopes a client to whoever created it. Without it every
-- supplier sees every other supplier's client book, DUNS numbers included.
CREATE TABLE IF NOT EXISTS customers (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id  UUID REFERENCES suppliers(id) ON DELETE CASCADE,
  name         VARCHAR(255) NOT NULL,
  duns_number  VARCHAR(20),
  contact_name VARCHAR(255),
  email        VARCHAR(255),
  phone        VARCHAR(50),
  address      TEXT,
  created_at   TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customers_supplier_id ON customers (supplier_id);

-- DUNS is unique within one supplier's book, not globally: two suppliers may
-- legitimately both invoice the same buyer. Partial index so the many rows
-- without a DUNS don't collide.
CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_supplier_duns
  ON customers (supplier_id, duns_number) WHERE duns_number IS NOT NULL;


-- ============================================================
-- invoices  (routes/invoices.js, routes/plaid.js, utils/cronJobs.js)
-- ============================================================
-- due_date is DATE, not TIMESTAMP: cronJobs.js compares it with
--   i.due_date = CURRENT_DATE + INTERVAL '3 days'
-- which never matches a TIMESTAMP unless the time is exactly midnight.
--
-- The supplier_plaid_* columns are denormalized copies written by
-- routes/plaid.js when a supplier links a bank, so unpaid invoices
-- carry their own token snapshot.
CREATE TABLE IF NOT EXISTS invoices (
  id                           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id                  UUID REFERENCES suppliers(id) ON DELETE CASCADE,
  customer_id                  UUID REFERENCES customers(id) ON DELETE SET NULL,
  invoice_number               VARCHAR(50) UNIQUE NOT NULL,
  description                  TEXT,
  status                       VARCHAR(20) NOT NULL DEFAULT 'pending'
                                 CHECK (status IN ('pending','approved','paid','rejected','cancelled')),
  total_amount                 NUMERIC(12,2) NOT NULL,
  advance_amount               NUMERIC(12,2),
  collected_amount             NUMERIC(12,2) DEFAULT 0,
  fee_percentage               NUMERIC(5,2),
  term_days                    INTEGER,
  issue_date                   DATE DEFAULT CURRENT_DATE,
  due_date                     DATE NOT NULL,
  file_path                    TEXT,
  final_payout_sent            BOOLEAN DEFAULT FALSE,
  plaid_access_token           TEXT,
  plaid_account_id             TEXT,
  supplier_plaid_access_token  TEXT,
  supplier_plaid_account_id    TEXT,
  created_at                   TIMESTAMP DEFAULT NOW(),
  updated_at                   TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoices_supplier_id    ON invoices (supplier_id);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_id    ON invoices (customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status         ON invoices (status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date       ON invoices (due_date);
-- The approval flow looks invoices up by number, not id.
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices (invoice_number);


-- ============================================================
-- Upgrades for databases created before a column existed
-- ============================================================
-- CREATE TABLE IF NOT EXISTS does nothing when the table already exists, so
-- new columns need explicit ALTERs. All are idempotent and safe to re-run.
ALTER TABLE customers ADD COLUMN IF NOT EXISTS supplier_id  UUID REFERENCES suppliers(id) ON DELETE CASCADE;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS duns_number  VARCHAR(20);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS contact_name VARCHAR(255);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS address      TEXT;


-- ============================================================
-- Notes on the existing docs -- read before trusting them
-- ============================================================
--
-- 1. BACKEND_IMPLEMENTATION_GUIDE.md:274 documents invoices with a
--    `client_name VARCHAR(255) NOT NULL` column. The code does not use it.
--    It joins customers and aliases the result:
--      LEFT JOIN customers c ON c.id = i.customer_id  ->  c.name AS client_name
--    That doc block is also invalid PostgreSQL: it puts `INDEX foo (bar)`
--    inside CREATE TABLE, which is MySQL syntax. It will not run as written.
--
-- 2. API_REFERENCE.md:277 documents users without reset_token /
--    reset_token_expiry, which routes/auth.js requires for password reset.
--
-- 3. server/migration.sql only holds ALTER TABLE statements that add
--    google_id, apple_id, avatar and the reset columns to a pre-existing
--    users table. Those columns are already included above, so do NOT run
--    migration.sql against a database built from this file -- it will fail
--    with "column already exists".
--
-- 4. suppliers and customers are not documented anywhere in the repo.
--    Their columns above are reconstructed from the queries that touch them,
--    so types are inferred (widths especially). Adjust if you have the
--    original definitions.
