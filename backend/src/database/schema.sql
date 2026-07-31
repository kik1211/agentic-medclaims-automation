-- ClaimPilot India Database Schema
-- Idempotent schema initialization for SQLite

CREATE TABLE IF NOT EXISTS hospitals (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    hospital_id TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS claims (
    id TEXT PRIMARY KEY,
    hospital_id TEXT NOT NULL,
    claim_type TEXT NOT NULL,
    status TEXT NOT NULL,
    insurer_code TEXT,
    priority TEXT DEFAULT 'NORMAL',
    pre_auth_reference TEXT,
    notes TEXT,
    assigned_reviewer_id TEXT,
    current_attempt INTEGER DEFAULT 1,
    clinical_status TEXT DEFAULT 'PENDING',
    clinical_json TEXT,
    clinical_started_at TEXT,
    clinical_completed_at TEXT,
    clinical_error TEXT,
    coding_status TEXT DEFAULT 'PENDING',
    coding_json TEXT,
    coding_started_at TEXT,
    coding_completed_at TEXT,
    coding_error TEXT,
    validation_status TEXT DEFAULT 'PENDING',
    validation_json TEXT,
    validation_started_at TEXT,
    validation_completed_at TEXT,
    validation_error TEXT,
    submission_status TEXT DEFAULT 'PENDING',
    submission_reference TEXT,
    submission_started_at TEXT,
    submission_completed_at TEXT,
    submission_error TEXT,
    completed_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_reviewer_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    claim_id TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type TEXT NOT NULL,
    document_type TEXT NOT NULL,
    ocr_text TEXT,
    ocr_status TEXT DEFAULT 'PENDING',
    ocr_started_at TEXT,
    ocr_completed_at TEXT,
    ocr_error TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (claim_id) REFERENCES claims(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS review_history (
    id TEXT PRIMARY KEY,
    claim_id TEXT NOT NULL,
    reviewer_id TEXT NOT NULL,
    decision TEXT NOT NULL,
    comments TEXT,
    previous_status TEXT NOT NULL,
    new_status TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (claim_id) REFERENCES claims(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    claim_id TEXT,
    user_id TEXT,
    action TEXT NOT NULL,
    details TEXT,
    ip_address TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (claim_id) REFERENCES claims(id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);
