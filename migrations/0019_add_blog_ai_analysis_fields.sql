-- Migration: Add AI analysis fields to blog_comments table
-- Date: 2025-11-19
-- Purpose: Add conversion probability and detailed AI analysis fields for blog comment analysis

-- Add conversion probability and AI analysis fields
ALTER TABLE blog_comments ADD COLUMN conversion_probability REAL DEFAULT 0.0;
ALTER TABLE blog_comments ADD COLUMN sentiment_score REAL DEFAULT 0.0;
ALTER TABLE blog_comments ADD COLUMN predicted_user_type TEXT CHECK(predicted_user_type IN ('B2C', 'B2B', NULL));
ALTER TABLE blog_comments ADD COLUMN confidence REAL DEFAULT 0.0;

-- Add B2C-specific classification fields
ALTER TABLE blog_comments ADD COLUMN b2c_stress_type TEXT CHECK(b2c_stress_type IN ('daily', 'work', NULL));
ALTER TABLE blog_comments ADD COLUMN b2c_detail_category TEXT;

-- Add B2B-specific classification fields
ALTER TABLE blog_comments ADD COLUMN b2b_business_type TEXT CHECK(b2b_business_type IN ('perfumer', 'company', 'shop', 'independent', NULL));

-- Add analysis metadata as JSON strings
ALTER TABLE blog_comments ADD COLUMN context_tags TEXT; -- JSON array of context tags
ALTER TABLE blog_comments ADD COLUMN mentioned_products TEXT; -- JSON array of mentioned products
ALTER TABLE blog_comments ADD COLUMN pain_points TEXT; -- JSON array of pain points
ALTER TABLE blog_comments ADD COLUMN next_action TEXT; -- Recommended next action
ALTER TABLE blog_comments ADD COLUMN recommended_products TEXT; -- JSON array of recommended product IDs

-- Add index for conversion probability queries
CREATE INDEX IF NOT EXISTS idx_blog_comments_conversion_probability 
ON blog_comments(conversion_probability DESC);

-- Add index for user type queries
CREATE INDEX IF NOT EXISTS idx_blog_comments_predicted_user_type 
ON blog_comments(predicted_user_type);

-- Add composite index for high-conversion lead queries
CREATE INDEX IF NOT EXISTS idx_blog_comments_high_conversion 
ON blog_comments(conversion_probability DESC, predicted_user_type, created_at DESC);
