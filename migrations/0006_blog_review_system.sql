-- 블로그 리뷰/댓글 시스템 및 AI 챗봇 스키마
-- 생성일: 2025-11-13

-- 블로그 포스트 테이블 (네이버 블로그 연동)
CREATE TABLE IF NOT EXISTS blog_posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id TEXT UNIQUE NOT NULL, -- 네이버 블로그 포스트 ID
  title TEXT NOT NULL,
  content TEXT,
  category TEXT, -- 증상케어, 리프레시 등
  url TEXT NOT NULL,
  published_at DATETIME,
  view_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 블로그 댓글 테이블
CREATE TABLE IF NOT EXISTS blog_comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL,
  comment_id TEXT UNIQUE, -- 네이버 댓글 ID
  author_name TEXT,
  author_id TEXT, -- 네이버 사용자 ID
  content TEXT NOT NULL,
  parent_comment_id INTEGER, -- 대댓글용
  
  -- AI 분석 결과
  sentiment TEXT CHECK(sentiment IN ('positive', 'negative', 'neutral', NULL)), -- 감정 분석
  user_type_prediction TEXT CHECK(user_type_prediction IN ('B2C', 'B2B', NULL)), -- 사용자 타입 예측
  intent TEXT, -- 의도: 구매, 문의, 체험, 납품 등
  keywords TEXT, -- JSON 배열: ["불면증", "스트레스", "회사" 등]
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES blog_posts(id) ON DELETE CASCADE
);

-- 챗봇 대화 세션 테이블
CREATE TABLE IF NOT EXISTS chatbot_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT UNIQUE NOT NULL,
  user_id INTEGER, -- 가입 사용자인 경우
  visitor_id TEXT, -- 비로그인 사용자 식별
  
  -- 사용자 분류 결과
  detected_user_type TEXT CHECK(detected_user_type IN ('B2C', 'B2B', 'unknown')),
  confidence_score REAL, -- 분류 신뢰도 (0.0 ~ 1.0)
  
  -- 세션 정보
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  ended_at DATETIME,
  message_count INTEGER DEFAULT 0,
  is_converted INTEGER DEFAULT 0, -- 가입 전환 여부
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 챗봇 메시지 테이블
CREATE TABLE IF NOT EXISTS chatbot_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER NOT NULL,
  sender TEXT NOT NULL CHECK(sender IN ('user', 'bot')),
  content TEXT NOT NULL,
  
  -- AI 분석 결과
  intent TEXT, -- 의도: greeting, inquiry, symptom_check, purchase_intent 등
  entities TEXT, -- JSON: 추출된 엔티티 (증상, 제품, 가격 등)
  sentiment TEXT CHECK(sentiment IN ('positive', 'negative', 'neutral', NULL)),
  user_type_signal TEXT, -- B2B/B2C 신호: company_mention, bulk_order, personal_use 등
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES chatbot_sessions(id) ON DELETE CASCADE
);

-- 사용자 행동 예측 테이블
CREATE TABLE IF NOT EXISTS user_behavior_predictions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  session_id INTEGER,
  visitor_id TEXT,
  
  -- 예측 결과
  predicted_action TEXT NOT NULL, -- next_purchase, workshop_booking, inquiry, churn 등
  confidence_score REAL, -- 예측 신뢰도
  recommended_products TEXT, -- JSON 배열: 추천 제품 ID
  recommended_workshops TEXT, -- JSON 배열: 추천 워크샵 ID
  
  -- 예측 근거
  based_on_features TEXT, -- JSON: 사용된 특징들
  prediction_reason TEXT, -- 예측 이유 설명
  
  -- 예측 검증
  is_accurate INTEGER, -- 예측이 맞았는지 (NULL: 아직 확인 안됨)
  actual_action TEXT, -- 실제로 취한 행동
  
  predicted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  validated_at DATETIME,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (session_id) REFERENCES chatbot_sessions(id) ON DELETE SET NULL
);

-- 사용자 관심사 프로필 테이블
CREATE TABLE IF NOT EXISTS user_interest_profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  visitor_id TEXT,
  
  -- 관심 증상 (가중치)
  insomnia_score REAL DEFAULT 0,
  depression_score REAL DEFAULT 0,
  anxiety_score REAL DEFAULT 0,
  stress_score REAL DEFAULT 0,
  fatigue_score REAL DEFAULT 0,
  
  -- 선호 제품 타입
  preferred_category TEXT, -- room_spray, diffuser, candle 등
  preferred_price_range TEXT, -- low, medium, high
  
  -- 행동 패턴
  avg_session_duration INTEGER, -- 초 단위
  visit_frequency TEXT, -- daily, weekly, monthly
  preferred_time TEXT, -- morning, afternoon, evening, night
  
  -- 구매 성향
  purchase_probability REAL, -- 0.0 ~ 1.0
  avg_order_value INTEGER,
  last_interaction_at DATETIME,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id),
  UNIQUE(visitor_id)
);

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON blog_posts(category);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON blog_posts(published_at);
CREATE INDEX IF NOT EXISTS idx_blog_comments_post ON blog_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_blog_comments_author ON blog_comments(author_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_sessions_user ON chatbot_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_sessions_visitor ON chatbot_sessions(visitor_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_sessions_type ON chatbot_sessions(detected_user_type);
CREATE INDEX IF NOT EXISTS idx_chatbot_messages_session ON chatbot_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_predictions_user ON user_behavior_predictions(user_id);
CREATE INDEX IF NOT EXISTS idx_predictions_visitor ON user_behavior_predictions(visitor_id);
CREATE INDEX IF NOT EXISTS idx_predictions_action ON user_behavior_predictions(predicted_action);
CREATE INDEX IF NOT EXISTS idx_interest_profiles_user ON user_interest_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_interest_profiles_visitor ON user_interest_profiles(visitor_id);
