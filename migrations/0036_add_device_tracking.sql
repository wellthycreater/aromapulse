-- Add device tracking columns to users table
ALTER TABLE users ADD COLUMN last_device_type TEXT; -- desktop, mobile, tablet
ALTER TABLE users ADD COLUMN last_os TEXT; -- windows, macos, ios, android, linux
ALTER TABLE users ADD COLUMN last_browser TEXT; -- chrome, safari, firefox, edge, etc
ALTER TABLE users ADD COLUMN last_ip TEXT;
ALTER TABLE users ADD COLUMN last_user_agent TEXT;
