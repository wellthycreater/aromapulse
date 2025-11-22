-- Update existing users with sample device data
-- 기존 사용자들에게 임시 디바이스 정보 할당

-- Desktop users (관리자 및 데스크톱 사용자)
UPDATE users SET 
  last_device_type = 'Desktop',
  last_os = 'Windows 10',
  last_browser = 'Chrome 120',
  last_ip = '127.0.0.1'
WHERE id IN (1, 2, 13, 14, 15, 22, 23, 24, 25);

-- Android users (Android 스마트폰 사용자)
UPDATE users SET 
  last_device_type = 'Android',
  last_os = 'Android 13',
  last_browser = 'Chrome 120',
  last_ip = '127.0.0.2'
WHERE id IN (5, 8, 9, 17, 18);

-- iOS users (iPhone 사용자)
UPDATE users SET 
  last_device_type = 'iOS',
  last_os = 'iOS 17.2',
  last_browser = 'Safari 17',
  last_ip = '127.0.0.3'
WHERE id IN (6, 7, 12, 16, 19, 39, 40);

-- iPad users (iPad 사용자)
UPDATE users SET 
  last_device_type = 'iPad',
  last_os = 'iPadOS 17.1',
  last_browser = 'Safari 17',
  last_ip = '127.0.0.4'
WHERE id IN (10, 11, 20);

-- Android Tablet users (Android 태블릿 사용자)
UPDATE users SET 
  last_device_type = 'Android Tablet',
  last_os = 'Android 13',
  last_browser = 'Chrome 120',
  last_ip = '127.0.0.5'
WHERE id IN (21);

-- Verify the update
SELECT 
  id, 
  name, 
  email, 
  last_device_type, 
  last_os, 
  last_browser
FROM users 
WHERE last_device_type IS NOT NULL
ORDER BY id;
