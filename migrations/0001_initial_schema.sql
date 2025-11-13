-- 아로마펄스 시장 테스트 플랫폼 초기 스키마
-- 생성일: 2025-11-13

-- 회원 테이블 (B2C/B2B 구분)
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  user_type TEXT NOT NULL DEFAULT 'B2C', -- 'B2C', 'B2B', 'Unknown'
  region TEXT, -- 지역 (서울, 경기, 부산 등)
  symptoms TEXT, -- JSON 배열: ["불면", "우울", "불안"]
  interests TEXT, -- JSON 배열: ["룸스프레이", "디퓨저", "향수"]
  source TEXT, -- 유입 경로 (블로그, 인스타, 카페 등)
  status TEXT DEFAULT 'active', -- active, inactive
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 네이버 블로그 포스트 테이블
CREATE TABLE IF NOT EXISTS blog_posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id TEXT UNIQUE NOT NULL, -- 네이버 블로그 logNo
  title TEXT NOT NULL,
  content TEXT,
  link TEXT NOT NULL,
  published_at DATETIME,
  category TEXT,
  tags TEXT, -- JSON 배열
  view_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 네이버 블로그 댓글 테이블
CREATE TABLE IF NOT EXISTS blog_comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  comment_id TEXT UNIQUE, -- 네이버 댓글 고유 ID
  post_id INTEGER NOT NULL,
  author_name TEXT,
  author_id TEXT,
  content TEXT NOT NULL,
  parent_id INTEGER, -- 대댓글인 경우
  is_secret INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  sentiment TEXT, -- 'positive', 'negative', 'neutral' (수동 태깅)
  intent TEXT, -- '관심', '문의', '체험후기', '구매의향' (수동 태깅)
  keywords TEXT, -- JSON 배열: 추출된 키워드
  is_tagged INTEGER DEFAULT 0, -- 관리자가 태깅했는지 여부
  created_at DATETIME,
  imported_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES blog_posts(id) ON DELETE CASCADE
);

-- 자체 리뷰 테이블
CREATE TABLE IF NOT EXISTS reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  post_id INTEGER, -- 연관된 블로그 포스트 (선택)
  content TEXT NOT NULL,
  rating INTEGER, -- 1-5점
  sentiment TEXT, -- 'positive', 'negative', 'neutral' (수동 태깅)
  intent TEXT, -- '관심', '문의', '체험후기', '구매의향' (수동 태깅)
  keywords TEXT, -- JSON 배열: 추출된 키워드
  is_tagged INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (post_id) REFERENCES blog_posts(id) ON DELETE SET NULL
);

-- 제품 테이블
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- '룸스프레이', '디퓨저', '향수', '섬유향수', '캔들'
  description TEXT,
  symptoms TEXT, -- JSON 배열: 연관 증상
  region TEXT, -- 판매 지역
  price INTEGER,
  is_b2b INTEGER DEFAULT 0, -- B2B 납품 가능 여부
  workshop_available INTEGER DEFAULT 0, -- 워크숍/클래스 가능 여부
  supplier_name TEXT, -- 공방/업체명
  supplier_contact TEXT,
  image_url TEXT,
  status TEXT DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 패치 신청 테이블
CREATE TABLE IF NOT EXISTS patch_applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT NOT NULL,
  symptoms TEXT, -- JSON 배열
  notes TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'shipped', 'completed'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  processed_at DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 설문 테이블 (BEFORE/AFTER)
CREATE TABLE IF NOT EXISTS surveys (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  application_id INTEGER, -- 연관된 패치 신청
  survey_type TEXT NOT NULL, -- 'before', 'after'
  stress_level INTEGER, -- 1-10
  sleep_quality INTEGER, -- 1-10
  anxiety_level INTEGER, -- 1-10
  depression_level INTEGER, -- 1-10
  feedback TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (application_id) REFERENCES patch_applications(id) ON DELETE CASCADE
);

-- 추천 로그 테이블
CREATE TABLE IF NOT EXISTS recommendation_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  product_id INTEGER,
  reason TEXT, -- 추천 이유 (증상 매칭, 지역 매칭 등)
  clicked INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- 관리자 테이블
CREATE TABLE IF NOT EXISTS admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'admin', -- 'admin', 'super_admin'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_type ON users(user_type);
CREATE INDEX IF NOT EXISTS idx_blog_posts_post_id ON blog_posts(post_id);
CREATE INDEX IF NOT EXISTS idx_blog_comments_post_id ON blog_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_blog_comments_tagged ON blog_comments(is_tagged);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_tagged ON reviews(is_tagged);
CREATE INDEX IF NOT EXISTS idx_products_type ON products(type);
CREATE INDEX IF NOT EXISTS idx_products_region ON products(region);
CREATE INDEX IF NOT EXISTS idx_patch_applications_status ON patch_applications(status);
CREATE INDEX IF NOT EXISTS idx_surveys_user_id ON surveys(user_id);
CREATE INDEX IF NOT EXISTS idx_recommendation_logs_user_id ON recommendation_logs(user_id);
