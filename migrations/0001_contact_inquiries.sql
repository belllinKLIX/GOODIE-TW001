CREATE TABLE IF NOT EXISTS contact_inquiries (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  company TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  project_type TEXT NOT NULL,
  timeline TEXT,
  quantity TEXT,
  description TEXT NOT NULL,
  reference_file_name TEXT,
  reference_file_type TEXT,
  reference_file_size INTEGER,
  reference_file_key TEXT,
  reference_file_token TEXT,
  reference_file_url TEXT,
  email_status TEXT NOT NULL DEFAULT 'pending' CHECK (email_status IN ('pending', 'sent', 'failed')),
  resend_email_id TEXT,
  email_error TEXT,
  created_at TEXT NOT NULL,
  emailed_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_contact_inquiries_created_at
ON contact_inquiries(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_contact_inquiries_email_status
ON contact_inquiries(email_status, created_at DESC);

PRAGMA optimize;
