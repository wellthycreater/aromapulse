-- Insert test activity logs for user_id 1
INSERT INTO user_activity_logs (user_id, activity_type, target_type, target_id, metadata) VALUES
-- 워크샵 조회
(1, 'view', 'workshop', 1, NULL),
(1, 'view', 'workshop', 2, NULL),
(1, 'view', 'workshop', 3, NULL),
(1, 'view', 'workshop', 1, NULL),  -- 중복 조회
(1, 'view', 'workshop', 4, NULL),

-- 검색
(1, 'search', NULL, NULL, '{"keyword":"수면"}'),
(1, 'search', NULL, NULL, '{"keyword":"스트레스"}'),
(1, 'search', NULL, NULL, '{"keyword":"수면","category":"수면케어"}'),
(1, 'search', NULL, NULL, '{"keyword":"블렌딩"}'),

-- 필터
(1, 'filter', NULL, NULL, '{"filter_type":"price","filter_value":"0-50000"}'),
(1, 'filter', NULL, NULL, '{"filter_type":"category","filter_value":"입문"}'),
(1, 'filter', NULL, NULL, '{"filter_type":"price","filter_value":"50000-100000"}'),

-- 클릭
(1, 'click', 'workshop', 1, '{"element_type":"workshop_card"}'),
(1, 'click', 'workshop', 2, '{"element_type":"workshop_card"}'),
(1, 'click', NULL, NULL, '{"element_type":"search_button"}'),

-- 페이지 뷰
(1, 'page_view', NULL, NULL, '{"page_name":"workshops_list","url":"/workshops"}'),
(1, 'page_view', NULL, NULL, '{"page_name":"workshop_detail","url":"/workshop/1"}'),
(1, 'page_view', NULL, NULL, '{"page_name":"dashboard","url":"/dashboard"}'),

-- 예약 시도/완료
(1, 'booking_attempt', 'workshop', 2, NULL),
(1, 'booking_complete', 'workshop', 2, '{"booking_id":1}'),

-- 리뷰 작성
(1, 'review_write', 'workshop', 1, '{"rating":5}'),
(1, 'review_write', 'workshop', 2, '{"rating":5}');
