-- Update existing users with diverse device information
-- This will create realistic device distribution for demo purposes

-- Update users with Android devices (30% of users)
UPDATE users SET 
    device_type = 'mobile',
    device_os = 'Android',
    device_browser = 'Chrome'
WHERE id IN (
    SELECT id FROM users 
    ORDER BY RANDOM() 
    LIMIT (SELECT CAST(COUNT(*) * 0.30 AS INTEGER) FROM users)
);

-- Update users with iOS devices (25% of remaining users)
UPDATE users SET 
    device_type = 'mobile',
    device_os = 'iOS',
    device_browser = 'Safari'
WHERE device_os IS NULL AND id IN (
    SELECT id FROM users 
    WHERE device_os IS NULL
    ORDER BY RANDOM() 
    LIMIT (SELECT CAST(COUNT(*) * 0.25 AS INTEGER) FROM users WHERE device_os IS NULL)
);

-- Update users with iPad/Tablet (10% of remaining users)
UPDATE users SET 
    device_type = 'tablet',
    device_os = 'iOS',
    device_browser = 'Safari'
WHERE device_os IS NULL AND id IN (
    SELECT id FROM users 
    WHERE device_os IS NULL
    ORDER BY RANDOM() 
    LIMIT (SELECT CAST(COUNT(*) * 0.10 AS INTEGER) FROM users WHERE device_os IS NULL)
);

-- Update users with Windows Desktop (20% of remaining users)
UPDATE users SET 
    device_type = 'desktop',
    device_os = 'Windows',
    device_browser = 'Chrome'
WHERE device_os IS NULL AND id IN (
    SELECT id FROM users 
    WHERE device_os IS NULL
    ORDER BY RANDOM() 
    LIMIT (SELECT CAST(COUNT(*) * 0.20 AS INTEGER) FROM users WHERE device_os IS NULL)
);

-- Update remaining users with macOS Desktop
UPDATE users SET 
    device_type = 'desktop',
    device_os = 'macOS',
    device_browser = 'Safari'
WHERE device_os IS NULL;

-- Verify the distribution
SELECT 
    device_os,
    device_type,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM users), 1) as percentage
FROM users
GROUP BY device_os, device_type
ORDER BY count DESC;
