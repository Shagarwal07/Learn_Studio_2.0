-- V3__multiple_google_accounts.sql

-- Drop the unique constraint on user_id to allow multiple google accounts per user
ALTER TABLE user_identity_profile DROP CONSTRAINT IF EXISTS user_identity_profile_user_id_key;

-- Add is_primary column to track the default account
ALTER TABLE user_identity_profile ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT FALSE;
