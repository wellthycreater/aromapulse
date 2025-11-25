-- 인천 지역 샘플 공방 추가
-- 실행 방법: Cloudflare Dashboard > D1 Console에서 한 줄씩 실행

-- 1. 계양구 (약 2.35km) - 가장 가까움!
INSERT INTO oneday_classes (provider_id, title, description, category, location, address, latitude, longitude, price, duration, max_participants, is_active) 
VALUES (1, '계양 힐링 공방', '천연 디퓨저와 향초 만들기 체험', '디퓨저', '인천 계양구', '인천시 계양구 계양대로 300', 37.5400, 126.7300, 40000, 90, 10, 1);

-- 2. 부평구 (약 3.94km)
INSERT INTO oneday_classes (provider_id, title, description, category, location, address, latitude, longitude, price, duration, max_participants, is_active) 
VALUES (1, '부평 향기 공방', '천연 비누와 캔들 만들기 원데이 클래스', '캔들/디퓨저', '인천 부평구', '인천시 부평구 부평대로 100', 37.5068, 126.7219, 45000, 120, 8, 1);

-- 3. 서구 (약 7.58km)
INSERT INTO oneday_classes (provider_id, title, description, category, location, address, latitude, longitude, price, duration, max_participants, is_active) 
VALUES (1, '서구 아로마 클래스', '나만의 향수 만들기 원데이 클래스', '향수/향초', '인천 서구', '인천시 서구 봉수대로 200', 37.5453, 126.6765, 55000, 150, 6, 1);

-- 확인 쿼리
SELECT id, title, location, latitude, longitude FROM oneday_classes ORDER BY id DESC LIMIT 3;
