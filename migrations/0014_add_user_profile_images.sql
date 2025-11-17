-- User Profile Images Table
CREATE TABLE IF NOT EXISTS user_profile_images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  image_data TEXT NOT NULL,  -- Base64 encoded image
  image_type TEXT NOT NULL,  -- image/jpeg, image/png, etc.
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id)  -- One profile image per user
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_profile_images_user_id ON user_profile_images(user_id);
