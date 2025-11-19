-- ================================================================
-- AromaPulse SNS Channel & O2O Conversion Sample Data
-- ================================================================
-- Purpose: SNS 채널 유입 및 온라인→오프라인 전환율 추적 데이터
-- Date: 2024-01-15
-- ================================================================

-- ================================================================
-- 1. SNS Channel Visits Data (최근 30일)
-- ================================================================
-- 블로그, 인스타그램, 유튜브 채널별 방문자 데이터

-- 블로그 방문 데이터 (Blog visits - steady growth)
INSERT INTO sns_visits (channel, visit_date, visitor_count, unique_visitors, click_through) VALUES
('blog', '2024-01-01', 120, 95, 45),
('blog', '2024-01-02', 135, 102, 52),
('blog', '2024-01-03', 145, 110, 58),
('blog', '2024-01-04', 150, 115, 62),
('blog', '2024-01-05', 165, 125, 68),
('blog', '2024-01-06', 155, 118, 65),
('blog', '2024-01-07', 140, 108, 55),
('blog', '2024-01-08', 175, 132, 72),
('blog', '2024-01-09', 180, 138, 75),
('blog', '2024-01-10', 190, 145, 80),
('blog', '2024-01-11', 195, 148, 82),
('blog', '2024-01-12', 205, 155, 88),
('blog', '2024-01-13', 200, 152, 85),
('blog', '2024-01-14', 185, 140, 78),
('blog', '2024-01-15', 220, 168, 95);

-- 인스타그램 방문 데이터 (Instagram visits - viral spikes)
INSERT INTO sns_visits (channel, visit_date, visitor_count, unique_visitors, click_through) VALUES
('instagram', '2024-01-01', 280, 215, 95),
('instagram', '2024-01-02', 295, 225, 102),
('instagram', '2024-01-03', 310, 238, 108),
('instagram', '2024-01-04', 325, 248, 115),
('instagram', '2024-01-05', 350, 268, 125), -- 릴스 바이럴
('instagram', '2024-01-06', 380, 290, 135),
('instagram', '2024-01-07', 365, 278, 128),
('instagram', '2024-01-08', 420, 320, 148), -- 협찬 게시물
('instagram', '2024-01-09', 445, 340, 158),
('instagram', '2024-01-10', 425, 325, 152),
('instagram', '2024-01-11', 410, 312, 145),
('instagram', '2024-01-12', 395, 302, 138),
('instagram', '2024-01-13', 385, 295, 132),
('instagram', '2024-01-14', 400, 305, 140),
('instagram', '2024-01-15', 430, 328, 155);

-- 유튜브 방문 데이터 (YouTube visits - consistent engagement)
INSERT INTO sns_visits (channel, visit_date, visitor_count, unique_visitors, click_through) VALUES
('youtube', '2024-01-01', 85, 68, 28),
('youtube', '2024-01-02', 92, 72, 32),
('youtube', '2024-01-03', 88, 70, 30),
('youtube', '2024-01-04', 95, 75, 35),
('youtube', '2024-01-05', 105, 82, 40), -- 새 영상 업로드
('youtube', '2024-01-06', 120, 95, 48),
('youtube', '2024-01-07', 115, 90, 45),
('youtube', '2024-01-08', 110, 85, 42),
('youtube', '2024-01-09', 125, 98, 50),
('youtube', '2024-01-10', 130, 102, 52),
('youtube', '2024-01-11', 135, 105, 55),
('youtube', '2024-01-12', 140, 110, 58), -- 튜토리얼 영상
('youtube', '2024-01-13', 155, 122, 65),
('youtube', '2024-01-14', 150, 118, 62),
('youtube', '2024-01-15', 160, 125, 68);

-- ================================================================
-- 2. Online-to-Offline Conversions (O2O 전환 데이터)
-- ================================================================
-- 온라인 유입 고객의 오프라인 공방 예약 및 방문 전환

-- Workshop locations for Seoul area
-- 강남, 홍대, 이태원, 성수, 연남, 삼청동 등 로컬 공방

-- Blog referral conversions (블로그 → 오프라인 전환)
INSERT INTO o2o_conversions (user_id, workshop_id, referral_source, conversion_type, workshop_location, conversion_date, amount) VALUES
(25, NULL, 'blog', 'workshop_booking', '강남 로컬 공방', '2024-01-03 14:30:00', 85000),
(27, NULL, 'blog', 'class_booking', '홍대 아로마 스튜디오', '2024-01-05 16:00:00', 120000),
(29, NULL, 'blog', 'workshop_booking', '이태원 향기 공방', '2024-01-07 11:00:00', 95000),
(31, NULL, 'blog', 'consultation', '강남 로컬 공방', '2024-01-08 15:30:00', 0),
(33, NULL, 'blog', 'workshop_booking', '성수 센트 스페이스', '2024-01-10 13:00:00', 110000),
(35, NULL, 'blog', 'store_visit', '홍대 아로마 스튜디오', '2024-01-11 10:30:00', 45000),
(37, NULL, 'blog', 'class_booking', '연남동 향수 아틀리에', '2024-01-13 17:00:00', 150000),
(39, NULL, 'blog', 'workshop_booking', '이태원 향기 공방', '2024-01-14 14:00:00', 95000);

-- Instagram referral conversions (인스타 → 오프라인 전환)
INSERT INTO o2o_conversions (user_id, workshop_id, referral_source, conversion_type, workshop_location, conversion_date, amount) VALUES
(26, NULL, 'instagram', 'workshop_booking', '강남 로컬 공방', '2024-01-02 13:00:00', 85000),
(28, NULL, 'instagram', 'class_booking', '홍대 아로마 스튜디오', '2024-01-04 15:30:00', 120000),
(30, NULL, 'instagram', 'workshop_booking', '삼청동 센트 갤러리', '2024-01-05 11:30:00', 130000),
(32, NULL, 'instagram', 'store_visit', '이태원 향기 공방', '2024-01-06 16:00:00', 55000),
(34, NULL, 'instagram', 'workshop_booking', '성수 센트 스페이스', '2024-01-08 14:00:00', 110000),
(36, NULL, 'instagram', 'consultation', '강남 로컬 공방', '2024-01-09 10:00:00', 0),
(38, NULL, 'instagram', 'class_booking', '연남동 향수 아틀리에', '2024-01-11 16:30:00', 150000),
(40, NULL, 'instagram', 'workshop_booking', '홍대 아로마 스튜디오', '2024-01-12 12:00:00', 95000),
(42, NULL, 'instagram', 'store_visit', '삼청동 센트 갤러리', '2024-01-13 15:00:00', 65000),
(44, NULL, 'instagram', 'workshop_booking', '이태원 향기 공방', '2024-01-15 13:30:00', 95000);

-- YouTube referral conversions (유튜브 → 오프라인 전환)
INSERT INTO o2o_conversions (user_id, workshop_id, referral_source, conversion_type, workshop_location, conversion_date, amount) VALUES
(41, NULL, 'youtube', 'workshop_booking', '홍대 아로마 스튜디오', '2024-01-04 11:00:00', 120000),
(43, NULL, 'youtube', 'class_booking', '성수 센트 스페이스', '2024-01-06 14:30:00', 110000),
(45, NULL, 'youtube', 'workshop_booking', '연남동 향수 아틀리에', '2024-01-08 16:00:00', 140000),
(47, NULL, 'youtube', 'store_visit', '강남 로컬 공방', '2024-01-10 10:30:00', 38000),
(49, NULL, 'youtube', 'workshop_booking', '삼청동 센트 갤러리', '2024-01-12 15:00:00', 130000),
(51, NULL, 'youtube', 'consultation', '이태원 향기 공방', '2024-01-14 11:30:00', 0);

-- Direct/Other referral conversions (직접 방문, 기타 경로)
INSERT INTO o2o_conversions (user_id, workshop_id, referral_source, conversion_type, workshop_location, conversion_date, amount) VALUES
(46, NULL, 'direct', 'workshop_booking', '강남 로컬 공방', '2024-01-03 10:00:00', 85000),
(48, NULL, 'direct', 'store_visit', '홍대 아로마 스튜디오', '2024-01-07 14:00:00', 52000),
(50, NULL, 'other', 'workshop_booking', '성수 센트 스페이스', '2024-01-09 13:00:00', 110000),
(52, NULL, 'direct', 'class_booking', '연남동 향수 아틀리에', '2024-01-11 15:30:00', 150000),
(54, NULL, 'other', 'consultation', '이태원 향기 공방', '2024-01-13 10:00:00', 0);

-- ================================================================
-- 3. Update User Referral Sources
-- ================================================================
-- 기존 사용자들에게 referral_source 설정 (소급 적용)

-- Blog referrals (8 users)
UPDATE users SET referral_source = 'blog' WHERE id IN (25, 27, 29, 31, 33, 35, 37, 39);

-- Instagram referrals (10 users)
UPDATE users SET referral_source = 'instagram' WHERE id IN (26, 28, 30, 32, 34, 36, 38, 40, 42, 44);

-- YouTube referrals (6 users)
UPDATE users SET referral_source = 'youtube' WHERE id IN (41, 43, 45, 47, 49, 51);

-- Direct/Other (5 users)
UPDATE users SET referral_source = 'direct' WHERE id IN (46, 48, 52);
UPDATE users SET referral_source = 'other' WHERE id IN (50, 54);

-- OAuth social login referrals
UPDATE users SET referral_source = 'kakao' WHERE oauth_provider = 'kakao' AND referral_source IS NULL;
UPDATE users SET referral_source = 'naver' WHERE oauth_provider = 'naver' AND referral_source IS NULL;
UPDATE users SET referral_source = 'google' WHERE oauth_provider = 'google' AND referral_source IS NULL;

-- ================================================================
-- Summary Statistics (For Reference)
-- ================================================================
-- Total SNS Visits (15 days):
--   Blog: 2,560 visitors → 1,030 clicks
--   Instagram: 5,715 visitors → 2,116 clicks  
--   YouTube: 1,810 visitors → 700 clicks
--
-- O2O Conversions:
--   Blog: 8 conversions
--   Instagram: 10 conversions
--   YouTube: 6 conversions
--   Direct/Other: 5 conversions
--   Total: 29 conversions
--
-- Conversion Rate: ~0.29% (29 conversions / 10,085 total visits)
-- ================================================================
