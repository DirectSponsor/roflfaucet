-- Chat cleanup log table
-- Tracks when cleanup was last run for each room

CREATE TABLE IF NOT EXISTS chat_cleanup_log (
    room_id INT NOT NULL PRIMARY KEY,
    last_cleanup INT NOT NULL DEFAULT 0,
    messages_deleted INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create index for faster lookups
CREATE INDEX idx_chat_cleanup_room ON chat_cleanup_log(room_id);
