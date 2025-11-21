-- Add profile_image column to users table
ALTER TABLE users ADD COLUMN profile_image TEXT;

-- Drop old user_profile_images table if exists (migrate to single column approach)
DROP TABLE IF EXISTS user_profile_images;
