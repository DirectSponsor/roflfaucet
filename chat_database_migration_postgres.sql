-- Chat System Database Migration for PostgreSQL
-- Date: August 3, 2025
-- Simplified version with 2 rooms: General and Help

-- Create chat_rooms table
CREATE TABLE IF NOT EXISTS chat_rooms (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on name
CREATE INDEX IF NOT EXISTS idx_chat_rooms_name ON chat_rooms(name);

-- Insert default rooms
INSERT INTO chat_rooms (name, description) VALUES 
('general', 'Main community chat for all users'),
('help', 'Commands, rules, and community guidelines')
ON CONFLICT (name) DO NOTHING;

-- Create message_type enum
DO $$ BEGIN
    CREATE TYPE message_type_enum AS ENUM ('message', 'tip', 'rain', 'system', 'join', 'leave');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    username VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    room_id INTEGER NOT NULL DEFAULT 1,
    message_type message_type_enum DEFAULT 'message',
    metadata JSONB NULL, -- For storing tip amounts, rain data, etc.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (room_id) REFERENCES chat_rooms(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_timestamp ON chat_messages(room_id, created_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);

-- Create chat_users_online table for tracking active users
CREATE TABLE IF NOT EXISTS chat_users_online (
    user_id VARCHAR(255) PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    room_id INTEGER NOT NULL DEFAULT 1,
    last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (room_id) REFERENCES chat_rooms(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_chat_users_online_room_id ON chat_users_online(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_users_online_last_seen ON chat_users_online(last_seen);

-- Create chat_user_limits for rate limiting
CREATE TABLE IF NOT EXISTS chat_user_limits (
    user_id VARCHAR(255) PRIMARY KEY,
    last_message_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    message_count_last_minute INTEGER DEFAULT 0,
    reset_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_chat_user_limits_reset_time ON chat_user_limits(reset_time);

-- Create function to cleanup old messages (PostgreSQL version)
CREATE OR REPLACE FUNCTION cleanup_old_chat_messages() 
RETURNS TRIGGER AS $$
DECLARE
    msg_count INTEGER;
BEGIN
    -- Count messages in the room
    SELECT COUNT(*) INTO msg_count FROM chat_messages WHERE room_id = NEW.room_id;
    
    -- If more than 1000 messages, delete oldest ones
    IF msg_count > 1000 THEN
        DELETE FROM chat_messages 
        WHERE room_id = NEW.room_id 
        AND id NOT IN (
            SELECT id FROM chat_messages 
            WHERE room_id = NEW.room_id 
            ORDER BY created_at DESC 
            LIMIT 1000
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-cleanup
DROP TRIGGER IF EXISTS cleanup_old_messages_trigger ON chat_messages;
CREATE TRIGGER cleanup_old_messages_trigger
    AFTER INSERT ON chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION cleanup_old_chat_messages();

-- Show the created structure
\d chat_rooms;
\d chat_messages;
\d chat_users_online;
\d chat_user_limits;
