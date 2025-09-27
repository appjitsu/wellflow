-- Migration: Add lockout_count field to users table
-- This field tracks the number of times an account has been locked
-- Used for progressive lockout duration calculation

-- Add lockout_count column with default value of 0
ALTER TABLE users 
ADD COLUMN lockout_count INTEGER NOT NULL DEFAULT 0;

-- Add comment to document the field
COMMENT ON COLUMN users.lockout_count IS 'Number of times the account has been locked for progressive lockout duration';

-- Create index for performance on lockout queries
CREATE INDEX idx_users_lockout_count ON users(lockout_count) WHERE lockout_count > 0;

-- Update existing locked accounts to have lockout_count = 1
-- This ensures existing locked accounts get proper progressive lockout behavior
UPDATE users 
SET lockout_count = 1 
WHERE locked_until IS NOT NULL AND locked_until > NOW();
