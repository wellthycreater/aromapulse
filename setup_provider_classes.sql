-- OAuth 제공자별 공방 데이터 분리
-- 구글 로그인 전용 (ID: 104, 105, 106)
-- 네이버 로그인 전용 (ID: 15, 16, 17)
-- 카카오 로그인 전용 (ID: 18, 101, 103)

-- 구글 전용 공방으로 설정 (provider_id = 2)
UPDATE oneday_classes SET provider_id = 2 WHERE id IN (104, 105, 106);

-- 네이버 전용 공방으로 설정 (provider_id = 3)
UPDATE oneday_classes SET provider_id = 3 WHERE id IN (15, 16, 17);

-- 카카오 전용 공방으로 설정 (provider_id = 4)
UPDATE oneday_classes SET provider_id = 4 WHERE id IN (18, 101, 103);

-- 확인 쿼리
SELECT id, title, location, provider_id, 
  CASE 
    WHEN provider_id = 2 THEN 'Google'
    WHEN provider_id = 3 THEN 'Naver'
    WHEN provider_id = 4 THEN 'Kakao'
    ELSE 'Unknown'
  END as oauth_provider
FROM oneday_classes 
WHERE is_active = 1
ORDER BY provider_id, id;
