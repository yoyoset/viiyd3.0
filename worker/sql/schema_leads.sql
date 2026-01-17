-- Schema for AI Quote System Leads
-- Table: leads

CREATE TABLE IF NOT EXISTS leads (
    id TEXT PRIMARY KEY,                 -- UUIDv4
    image_url TEXT NOT NULL,             -- URL of the diverse/uploaded image
    contact_info TEXT NOT NULL,          -- JSON: {type: 'email', value: '...', discord_id: '...'}
    ai_estimate_json TEXT NOT NULL,      -- JSON: {base_price: 30, complexity: 1.2, est_range: '30-40'}
    user_notes TEXT,                     -- User's optional requests
    model_type TEXT NOT NULL,            -- 'infantry', 'vehicle', etc.
    quantity INTEGER DEFAULT 1,          -- Number of models
    status TEXT DEFAULT 'new',           -- 'new', 'reviewed', 'contacted', 'converted', 'rejected'
    admin_notes TEXT,                    -- Internal admin comments
    priority_score INTEGER DEFAULT 0,    -- 0=Standard, 10=High(Titan/Bulk)
    created_at INTEGER NOT NULL          -- Unix Timestamp (ms)
);

-- Index for quick admin lookup by status
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);
