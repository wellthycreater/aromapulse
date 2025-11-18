-- 천연 디퓨저 만들기 추가
INSERT INTO workshops (id, provider_id, title, description, category, location, address, price, duration, max_participants, image_url, is_active, type, created_at, updated_at)
VALUES (4, 1, '천연 디퓨저 만들기', '100% 천연 에센셜 오일로 만드는 나만의 디퓨저 클래스입니다. 집안을 은은한 향기로 채워보세요.', '디퓨저 만들기', '경기', '분당구 정자동 456', 55000, 90, 8, null, 1, 'class', datetime('now'), datetime('now'));

-- 나만의 향수 만들기 추가
INSERT INTO workshops (id, provider_id, title, description, category, location, address, price, duration, max_participants, image_url, is_active, type, created_at, updated_at)
VALUES (5, 1, '나만의 향수 만들기', '조향사가 직접 알려주는 향수 만들기 클래스. 나만의 시그니처 향을 만들어보세요.', '향수 만들기', '서울', '강남구 청담동 789', 85000, 150, 6, null, 1, 'class', datetime('now'), datetime('now'));
