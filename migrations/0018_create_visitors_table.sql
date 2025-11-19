-- 방문자 추적 테이블
CREATE TABLE IF NOT EXISTS visitors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  visitor_id TEXT NOT NULL, -- 브라우저 고유 ID (UUID)
  ip_address TEXT,
  user_agent TEXT,
  page_url TEXT,
  referrer TEXT,
  visit_date DATE NOT NULL, -- 방문 날짜 (YYYY-MM-DD)
  visit_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  session_id TEXT, -- 세션 ID
  is_unique_today INTEGER DEFAULT 0, -- 오늘 첫 방문 여부
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 방문자 통계 테이블 (일일 집계)
CREATE TABLE IF NOT EXISTS visitor_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  stat_date DATE NOT NULL UNIQUE, -- 통계 날짜
  total_visits INTEGER DEFAULT 0, -- 총 방문 수
  unique_visitors INTEGER DEFAULT 0, -- 고유 방문자 수
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_visitors_visitor_id ON visitors(visitor_id);
CREATE INDEX IF NOT EXISTS idx_visitors_visit_date ON visitors(visit_date);
CREATE INDEX IF NOT EXISTS idx_visitors_session_id ON visitors(session_id);
CREATE INDEX IF NOT EXISTS idx_visitor_stats_date ON visitor_stats(stat_date);
