-- Chat System Database Migration
-- Date: August 3, 2025
-- Simplified version with 2 rooms: General and Help

-- Create chat_rooms table
CREATE TABLE IF NOT EXISTS chat_rooms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_name (name)
);

-- Insert default rooms
INSERT IGNORE INTO chat_rooms (name, description) VALUES 
('general', 'Main community chat for all users'),
('help', 'Commands, rules, and community guidelines');

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    username VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    room_id INT NOT NULL DEFAULT 1,
    message_type ENUM('message', 'tip', 'rain', 'system', 'join', 'leave') DEFAULT 'message',
    metadata JSON NULL COMMENT 'For storing tip amounts, rain data, etc.',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_room_timestamp (room_id, created_at),
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (room_id) REFERENCES chat_rooms(id) ON DELETE CASCADE
);

-- Create chat_users_online table for tracking active users
CREATE TABLE IF NOT EXISTS chat_users_online (
    user_id VARCHAR(255) PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    room_id INT NOT NULL DEFAULT 1,
    last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_room_id (room_id),
    INDEX idx_last_seen (last_seen),
    FOREIGN KEY (room_id) REFERENCES chat_rooms(id) ON DELETE CASCADE
);

-- Create chat_user_limits for rate limiting
CREATE TABLE IF NOT EXISTS chat_user_limits (
    user_id VARCHAR(255) PRIMARY KEY,
    last_message_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    message_count_last_minute INT DEFAULT 0,
    reset_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_reset_time (reset_time)
);

-- Auto-cleanup old messages (keep last 1000 messages per room)
-- This will be handled by a cleanup script or trigger
DELIMITER //
CREATE TRIGGER IF NOT EXISTS cleanup_old_messages 
AFTER INSERT ON chat_messages
FOR EACH ROW
BEGIN
    DECLARE msg_count INT;
    SELECT COUNT(*) INTO msg_count FROM chat_messages WHERE room_id = NEW.room_id;
    
    IF msg_count > 1000 THEN
        DELETE FROM chat_messages 
        WHERE room_id = NEW.room_id 
        AND id NOT IN (
            SELECT id FROM (
                SELECT id FROM chat_messages 
                WHERE room_id = NEW.room_id 
                ORDER BY created_at DESC 
                LIMIT 1000
            ) as keep_messages
        );
    END IF;
END//
DELIMITER ;

-- Show the created structure
DESCRIBE chat_rooms;
DESCRIBE chat_messages;
DESCRIBE chat_users_online;
DESCRIBE chat_user_limits;
