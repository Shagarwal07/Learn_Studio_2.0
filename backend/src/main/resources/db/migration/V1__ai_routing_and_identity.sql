-- V1__ai_routing_and_identity.sql

CREATE TABLE IF NOT EXISTS user_identity_profile (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT UNIQUE NOT NULL REFERENCES users(id),
    google_email VARCHAR(255),
    google_sub VARCHAR(255),
    google_name VARCHAR(255),
    google_picture_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_ai_plan (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT UNIQUE NOT NULL REFERENCES users(id),
    plan_type VARCHAR(50) NOT NULL DEFAULT 'FREE', -- FREE, PREMIUM, BYOK
    plan_status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, EXPIRED, SUSPENDED
    ai_monthly_limit INT NOT NULL DEFAULT 50,
    ai_monthly_used INT NOT NULL DEFAULT 0,
    billing_owner VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_ai_credentials (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    provider VARCHAR(100) NOT NULL,
    encrypted_api_key TEXT NOT NULL,
    key_last4 VARCHAR(4) NOT NULL,
    key_hash VARCHAR(255),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ai_usage_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    plan_type VARCHAR(50),
    provider VARCHAR(100),
    model VARCHAR(255),
    feature VARCHAR(100),
    tokens_used INT DEFAULT 0,
    estimated_cost DECIMAL(10,6) DEFAULT 0,
    latency_ms BIGINT DEFAULT 0,
    success BOOLEAN DEFAULT TRUE,
    error_type TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
