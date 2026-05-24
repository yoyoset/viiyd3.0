-- VIIYD Commission D1 schema
-- Run: wrangler d1 execute commissions-db --file=schema.sql

CREATE TABLE IF NOT EXISTS commissions (
  id                  TEXT    PRIMARY KEY,          -- "VY-2026-0524-K7"
  created_at          INTEGER NOT NULL,             -- unix ms
  name                TEXT    NOT NULL,
  contact             TEXT    NOT NULL,             -- "WeChat · viiyd_studio"
  project             TEXT    NOT NULL,             -- "single" | "squad" | "vehicle" | "diorama" | "repair" | "other"
  tier                TEXT    NOT NULL,             -- "tabletop" | "display" | "unsure"
  deadline            TEXT,                         -- free-form ("end of year")
  notes               TEXT,
  reference_urls      TEXT,                         -- JSON array of R2 keys
  status              TEXT    DEFAULT 'new',        -- new | replied | accepted | declined | done
  telegram_message_id INTEGER                       -- for editing pin on status change
);

CREATE INDEX IF NOT EXISTS idx_commissions_status     ON commissions(status);
CREATE INDEX IF NOT EXISTS idx_commissions_created_at ON commissions(created_at DESC);
