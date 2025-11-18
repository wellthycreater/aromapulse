-- 강사 테이블 (조향사, 심리상담사, 멘탈케어 전문가)
CREATE TABLE IF NOT EXISTS instructors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  
  -- 강사 유형
  type TEXT NOT NULL CHECK(type IN ('perfumer', 'psychologist', 'mental_care', 'other')),
  -- perfumer: 조향사
  -- psychologist: 심리상담사
  -- mental_care: 멘탈케어 전문가
  -- other: 기타
  
  -- 강사 정보
  title TEXT, -- 직함 (예: 수석 조향사, 임상심리전문가)
  specialization TEXT, -- 전문 분야
  bio TEXT, -- 소개
  experience_years INTEGER, -- 경력 (년)
  
  -- 연락처
  email TEXT,
  phone TEXT,
  
  -- 가격 정보
  hourly_rate INTEGER, -- 시간당 강사료
  daily_rate INTEGER, -- 일일 강사료
  
  -- 이미지
  profile_image_url TEXT,
  
  -- 인증 정보
  certifications TEXT, -- JSON 형식 자격증 목록
  
  -- 가용성
  is_available INTEGER DEFAULT 1,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 워크샵 견적 문의 테이블
CREATE TABLE IF NOT EXISTS workshop_quotes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  workshop_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  
  -- 기업 정보
  company_name TEXT NOT NULL,
  company_contact_name TEXT NOT NULL, -- 담당자 이름
  company_contact_phone TEXT NOT NULL,
  company_contact_email TEXT NOT NULL,
  company_department TEXT, -- 부서
  
  -- 워크샵 요청 정보
  participant_count INTEGER NOT NULL, -- 예상 참가 인원
  preferred_date DATETIME, -- 희망 일정
  preferred_location TEXT, -- 희망 장소
  duration_hours INTEGER, -- 희망 진행 시간
  
  -- 강사 요청
  requested_instructors TEXT, -- JSON 형식 [{type, count, specialization}]
  -- 예: [{"type":"perfumer","count":2,"specialization":"캔들 제작"},{"type":"psychologist","count":1}]
  
  -- 추가 요청사항
  special_requests TEXT, -- 특별 요청사항
  budget_range TEXT, -- 예산 범위
  
  -- 워케이션 여부
  is_workation INTEGER DEFAULT 0, -- 워케이션 여행 포함 여부
  workation_destination TEXT, -- 워케이션 목적지
  workation_duration_days INTEGER, -- 워케이션 기간 (일)
  
  -- 상태
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'reviewed', 'quoted', 'accepted', 'rejected', 'completed')),
  -- pending: 접수
  -- reviewed: 검토중
  -- quoted: 견적 발송
  -- accepted: 수락
  -- rejected: 거절
  -- completed: 완료
  
  -- 견적 정보 (관리자가 입력)
  quoted_price INTEGER,
  quote_details TEXT, -- 견적 상세 내역
  admin_notes TEXT, -- 관리자 메모
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (workshop_id) REFERENCES workshops(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 워크샵-강사 매핑 테이블 (워크샵에 배정된 강사)
CREATE TABLE IF NOT EXISTS workshop_instructors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  workshop_id INTEGER NOT NULL,
  instructor_id INTEGER NOT NULL,
  quote_id INTEGER, -- 견적 문의와 연결 (옵션)
  
  -- 강사별 역할
  role TEXT, -- 예: 주강사, 보조강사
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (workshop_id) REFERENCES workshops(id),
  FOREIGN KEY (instructor_id) REFERENCES instructors(id),
  FOREIGN KEY (quote_id) REFERENCES workshop_quotes(id),
  
  UNIQUE(workshop_id, instructor_id)
);

-- 향기 테마 워케이션 상품 테이블
CREATE TABLE IF NOT EXISTS workation_packages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- 상품 정보
  name TEXT NOT NULL,
  description TEXT,
  destination TEXT NOT NULL, -- 목적지
  
  -- 테마
  theme TEXT, -- 향기 테마 (예: 라벤더, 제주 감귤)
  
  -- 기간 및 가격
  duration_days INTEGER NOT NULL,
  min_participants INTEGER,
  max_participants INTEGER,
  price_per_person INTEGER,
  
  -- 포함 사항
  included_items TEXT, -- JSON 형식 포함 항목 목록
  -- 예: ["숙박", "식사", "워크샵 재료", "강사비", "교통"]
  
  -- 이미지
  image_url TEXT,
  thumbnail_urls TEXT, -- JSON 형식 갤러리 이미지
  
  -- 가용성
  is_active INTEGER DEFAULT 1,
  available_seasons TEXT, -- 이용 가능 시즌 (예: "봄,여름,가을")
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_instructors_type ON instructors(type);
CREATE INDEX IF NOT EXISTS idx_instructors_available ON instructors(is_available);
CREATE INDEX IF NOT EXISTS idx_workshop_quotes_workshop ON workshop_quotes(workshop_id);
CREATE INDEX IF NOT EXISTS idx_workshop_quotes_user ON workshop_quotes(user_id);
CREATE INDEX IF NOT EXISTS idx_workshop_quotes_status ON workshop_quotes(status);
CREATE INDEX IF NOT EXISTS idx_workshop_instructors_workshop ON workshop_instructors(workshop_id);
CREATE INDEX IF NOT EXISTS idx_workshop_instructors_instructor ON workshop_instructors(instructor_id);
CREATE INDEX IF NOT EXISTS idx_workation_packages_active ON workation_packages(is_active);
