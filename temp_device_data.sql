-- 기존 사용자들에게 임시 디바이스 정보 할당
-- Cloudflare D1 Console에서 실행하세요

-- Android 디바이스 (녹색)
UPDATE users SET 
  last_device_type = 'Android',
  last_os = 'Android 13',
  last_browser = 'Chrome 120',
  last_ip = '203.251.180.100'
WHERE id IN (5, 13, 21, 2);

-- iOS 디바이스 (파란색)
UPDATE users SET 
  last_device_type = 'iOS',
  last_os = 'iOS 17.2',
  last_browser = 'Safari 17',
  last_ip = '211.36.148.50'
WHERE id IN (6, 14, 22, 39);

-- iPad 디바이스 (보라색)
UPDATE users SET 
  last_device_type = 'iPad',
  last_os = 'iPadOS 17.1',
  last_browser = 'Safari 17',
  last_ip = '121.165.200.30'
WHERE id IN (7, 15, 23, 40);

-- Android Tablet 디바이스 (청록색)
UPDATE users SET 
  last_device_type = 'Android Tablet',
  last_os = 'Android 13',
  last_browser = 'Chrome 120',
  last_ip = '175.223.10.80'
WHERE id IN (8, 16, 24);

-- Desktop 디바이스 (회색)
UPDATE users SET 
  last_device_type = 'Desktop',
  last_os = 'Windows 10',
  last_browser = 'Chrome 120',
  last_ip = '58.120.170.200'
WHERE id IN (9, 17, 25, 1);

UPDATE users SET 
  last_device_type = 'Desktop',
  last_os = 'macOS 14.2',
  last_browser = 'Safari 17',
  last_ip = '175.113.50.100'
WHERE id IN (10, 18);

UPDATE users SET 
  last_device_type = 'Desktop',
  last_os = 'Windows 11',
  last_browser = 'Edge 120',
  last_ip = '121.130.200.50'
WHERE id IN (11, 19);

UPDATE users SET 
  last_device_type = 'Desktop',
  last_os = 'Windows 10',
  last_browser = 'Firefox 121',
  last_ip = '211.200.100.30'
WHERE id IN (12, 20);

-- 검증 쿼리 (모든 업데이트 확인)
SELECT 
  id, 
  name, 
  email,
  last_device_type, 
  last_os, 
  last_browser
FROM users 
WHERE id <= 40
ORDER BY id;
