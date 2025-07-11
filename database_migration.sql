-- Database Migration for Transaction System
-- Date: June 21, 2025

-- Add lifetime_earned column to user_balances if it doesn't exist
ALTER TABLE user_balances 
ADD COLUMN IF NOT EXISTS lifetime_earned DECIMAL(15,2) DEFAULT 0;

-- Create transaction_log table for audit trail
CREATE TABLE IF NOT EXISTS transaction_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    type ENUM('spend', 'earn', 'gaming_win') NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    source VARCHAR(100) NOT NULL,
    description TEXT,
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_type (type),
    INDEX idx_source (source),
    INDEX idx_created_at (created_at)
);

-- Populate lifetime_earned for existing users (one-time migration)
-- Only update users where lifetime_earned is 0 to avoid overwriting existing data
UPDATE user_balances 
SET lifetime_earned = useless_coins 
WHERE lifetime_earned = 0 AND useless_coins > 0;

-- Optional: Create a view for easy transaction reporting
CREATE OR REPLACE VIEW user_transaction_summary AS
SELECT 
    user_id,
    COUNT(*) as total_transactions,
    SUM(CASE WHEN type = 'spend' THEN amount ELSE 0 END) as total_spent,
    SUM(CASE WHEN type = 'earn' THEN amount ELSE 0 END) as total_earned,
    SUM(CASE WHEN type = 'gaming_win' THEN amount ELSE 0 END) as total_gaming_wins,
    MAX(created_at) as last_transaction
FROM transaction_log
GROUP BY user_id;

-- Show the updated structure
DESCRIBE user_balances;
DESCRIBE transaction_log;

