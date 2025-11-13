-- 블로그 포스트 샘플 데이터
INSERT OR IGNORE INTO blog_posts (id, post_id, title, content, author, published_at, url, category, tags, view_count, like_count, comment_count, main_topics, target_audience) VALUES
(1, 'blog_post_001', '불면증 극복! 라벤더 아로마로 숙면하기', '불면증으로 고생하시는 분들을 위한 천연 아로마테라피 가이드입니다.', '아로마펄스', '2025-11-10 14:00:00', 'https://blog.naver.com/aromapulse/post001', 'symptom_care', '["insomnia", "lavender", "sleep"]', 1250, 48, 12, '["수면", "불면증", "라벤더"]', 'B2C'),
(2, 'blog_post_002', '직장인 스트레스 해소법 - 아로마테라피', '바쁜 직장인을 위한 간단한 아로마테라피 활용법을 소개합니다.', '아로마펄스', '2025-11-08 10:30:00', 'https://blog.naver.com/aromapulse/post002', 'symptom_care', '["stress", "office", "work"]', 980, 35, 8, '["스트레스", "직장", "업무"]', 'B2C'),
(3, 'blog_post_003', '기업 복리후생 - 아로마테라피 워크샵', '기업 직원 힐링을 위한 맞춤형 아로마테라피 워크샵 프로그램입니다.', '아로마펄스', '2025-11-05 16:00:00', 'https://blog.naver.com/aromapulse/post003', 'workshop', '["corporate", "workshop", "b2b"]', 750, 22, 5, '["기업", "워크샵", "복리후생"]', 'B2B');

-- 블로그 댓글 샘플 데이터 (고전환율 리드)
INSERT OR IGNORE INTO blog_comments (
  id, comment_id, post_id, author_name, author_id, content, published_at,
  user_type_prediction, user_type_confidence,
  b2c_stress_type, b2c_detail_category,
  sentiment, sentiment_score,
  intent, intent_keywords,
  context_tags, mentioned_products, pain_points,
  next_action_prediction, recommended_products, conversion_probability
) VALUES
-- B2C 고전환율 리드 1
(1, 'comment_001', 1, '수면전문가김민지', 'user_001', 
'불면증으로 3년째 고생중인데 이 글 보고 희망이 생겼어요. 라벤더 제품 어디서 구매할 수 있나요? 가격대도 궁금합니다!', 
'2025-11-10 15:30:00',
'B2C', 0.92,
'daily', 'job_seeker',
'positive', 0.8,
'purchase_intent', '["구매", "가격", "문의"]',
'["insomnia", "lavender", "purchase"]', '[]', '["price_concern"]',
'likely_purchase', '[1]', 0.85),

-- B2C 고전환율 리드 2
(2, 'comment_002', 2, '직장인박서연', 'user_002',
'회사 야근이 많아서 스트레스가 심한데 아로마테라피 효과 있을까요? 사고싶은데 추천 제품 있으면 알려주세요.',
'2025-11-08 11:45:00',
'B2C', 0.88,
'work', NULL,
'neutral', 0.3,
'inquiry', '["추천", "효과", "구매"]',
'["stress", "work", "inquiry"]', '[]', '["effectiveness_doubt"]',
'needs_consultation', '[2]', 0.72),

-- B2C 고전환율 리드 3
(3, 'comment_003', 1, '학생이지은', 'user_003',
'취준생인데 스트레스로 잠을 못자서 너무 힘들어요ㅠㅠ 이거 정말 효과 있나요? 가격이 부담스럽지 않으면 한번 써보고 싶어요.',
'2025-11-10 18:20:00',
'B2C', 0.85,
'daily', 'job_seeker',
'negative', -0.3,
'purchase_intent', '["구매", "가격", "효과"]',
'["stress", "insomnia", "student"]', '[]', '["price_concern", "effectiveness_doubt"]',
'price_sensitive', '[1]', 0.68),

-- B2B 고전환율 리드
(4, 'comment_004', 3, '인사팀장최영수', 'user_004',
'우리 회사도 직원 복리후생으로 아로마 워크샵 도입하고 싶은데 대량 납품도 가능한가요? 문의 남기고 싶습니다.',
'2025-11-05 17:30:00',
'B2B', 0.95,
NULL, NULL,
'positive', 0.7,
'inquiry', '["납품", "대량", "워크샵", "문의"]',
'["corporate", "workshop", "bulk_order"]', '[]', '[]',
'needs_consultation', '[]', 0.78),

-- B2C 중간 전환율 리드
(5, 'comment_005', 2, '주부정수진', 'user_005',
'아이 돌보고 집안일하느라 지쳐서 아로마테라피 관심 생겼어요. 좋은 정보 감사합니다!',
'2025-11-08 14:00:00',
'B2C', 0.80,
'daily', 'caregiver_working_mom',
'positive', 0.9,
'experience_sharing', '["감사", "관심"]',
'["stress", "caregiver"]', '[]', '[]',
'needs_more_info', '[2]', 0.55),

-- B2C 낮은 전환율
(6, 'comment_006', 1, '구경꾼이철수', 'user_006',
'오 그렇군요. 재밌는 글이네요.',
'2025-11-10 20:00:00',
'unknown', 0.35,
NULL, NULL,
'neutral', 0.0,
'experience_sharing', '[]',
'[]', '[]', '[]',
'needs_more_info', '[]', 0.25);
