-- Owners table: authenticated users who create widgets (tenants)
CREATE TABLE owners (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Widgets table: each widget config, tenant-isolated via owner_id
CREATE TABLE widgets (
  id SERIAL PRIMARY KEY,
  owner_id INTEGER NOT NULL REFERENCES owners(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  copy_text TEXT,
  fields JSONB NOT NULL DEFAULT '[]',
  targeting JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Submissions table: visitor form submissions, enriched with geo data
CREATE TABLE submissions (
  id SERIAL PRIMARY KEY,
  widget_id INTEGER NOT NULL REFERENCES widgets(id) ON DELETE CASCADE,
  data JSONB NOT NULL,
  ip_address VARCHAR(45),
  geo_country VARCHAR(100),
  geo_city VARCHAR(100),
  geo_provider_used VARCHAR(50),
  is_spam BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_widgets_owner_id ON widgets(owner_id);
CREATE INDEX idx_submissions_widget_id ON submissions(widget_id);
CREATE INDEX idx_submissions_created_at ON submissions(created_at);