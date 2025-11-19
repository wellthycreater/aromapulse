# 프로덕션 방문자 추적 테이블 생성

## Cloudflare Dashboard에서 실행
**위치**: https://dash.cloudflare.com/ > Workers & Pages > D1 > aromapulse-production > Console

## 1단계: visitors 테이블 생성
```sql
CREATE TABLE IF NOT EXISTS visitors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  visitor_id TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  page_url TEXT,
  referrer TEXT,
  visit_date DATE NOT NULL,
  visit_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  session_id TEXT,
  is_unique_today INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## 2단계: visitor_stats 테이블 생성
```sql
CREATE TABLE IF NOT EXISTS visitor_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  stat_date DATE NOT NULL UNIQUE,
  total_visits INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## 3단계: 인덱스 생성 (visitor_id)
```sql
CREATE INDEX IF NOT EXISTS idx_visitors_visitor_id ON visitors(visitor_id);
```

## 4단계: 인덱스 생성 (visit_date)
```sql
CREATE INDEX IF NOT EXISTS idx_visitors_visit_date ON visitors(visit_date);
```

## 5단계: 인덱스 생성 (session_id)
```sql
CREATE INDEX IF NOT EXISTS idx_visitors_session_id ON visitors(session_id);
```

## 6단계: 인덱스 생성 (stat_date)
```sql
CREATE INDEX IF NOT EXISTS idx_visitor_stats_date ON visitor_stats(stat_date);
```

## 7단계: 확인
```sql
SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%visitor%';
```

결과:
- visitors
- visitor_stats

---

**참고**: 각 SQL 문을 개별적으로 실행하세요.
