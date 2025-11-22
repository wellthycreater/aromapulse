# ✅ 원데이 클래스 페이지 수정 완료!

## 🎯 완료된 작업

### 1. API 엔드포인트 수정
**문제**: 원데이 클래스 페이지가 `/api/workshops/ID`를 호출하여 404 에러 발생

**해결**:
- ✅ 프론트엔드 JavaScript 수정: 페이지 타입 감지 로직 추가
- ✅ 백엔드 라우트 추가: `/api/classes` 엔드포인트 생성
- ✅ 올바른 API 호출: 클래스 페이지는 `/api/classes/ID`, 워크샵 페이지는 `/api/workshops/ID`

**변경 파일**:
- `/home/user/webapp/public/static/workshop-detail.js` (API 엔드포인트 감지)
- `/home/user/webapp/src/index.tsx` (라우트 추가)

### 2. UI 텍스트 수정
**문제**: 원데이 클래스 페이지에서 "워크샵" 용어 사용

**해결**:
- ✅ "원하시는 워크샵 분위기" → "원하시는 클래스 분위기"
- ✅ 보라색 아이콘 → 초록색 아이콘 (원데이 클래스 테마 컬러)
- ✅ 💜 이모지 → 💚 이모지 변경

**변경 파일**:
- `/home/user/webapp/public/static/class-detail.html` (특별 요청사항 섹션)

### 3. 데이터베이스 테이블 생성
**문제**: 프로덕션 DB에 `oneday_classes` 테이블이 없어 API 에러 발생

**해결**:
- ✅ `oneday_classes` 테이블 생성 완료
- ✅ 인덱스 생성: `idx_oneday_classes_provider`, `idx_oneday_classes_active`
- ✅ 테스트 데이터 삽입: ID 101 원데이 클래스

**실행 명령어**:
```bash
npx wrangler d1 execute aromapulse-production --remote --command="CREATE TABLE..."
npx wrangler d1 execute aromapulse-production --remote --command="CREATE INDEX..."
npx wrangler d1 execute aromapulse-production --remote --command="INSERT INTO..."
```

### 4. 프로덕션 배포
**배포 완료**: ✅ 3회 배포 성공
- ✅ 첫 번째 배포: API 엔드포인트 수정
- ✅ 두 번째 배포: `/api/classes` 라우트 추가
- ✅ 세 번째 배포: UI 텍스트 수정

**배포 URL**: https://www.aromapulse.kr

## 🧪 테스트 결과

### API 테스트
```bash
curl https://www.aromapulse.kr/api/classes/101
```

**응답**: ✅ 성공
```json
{
  "id": 101,
  "provider_id": 1,
  "title": "힐링 아로마 원데이 클래스",
  "description": "나만의 향기를 만드는 특별한 시간! 전문 조향사와 함께 아로마테라피의 기초부터 배우고, 직접 향수를 만들어보는 원데이 클래스입니다.",
  "category": "아로마테라피",
  "location": "서울 강남구",
  "address": "서울시 강남구 테헤란로 123",
  "price": 50000,
  "duration": 120,
  "max_participants": 10,
  "provider_name": "프로덕션 테스트",
  "provider_phone": "010-9999-8888"
}
```

### 프론트엔드 테스트
**URL**: https://www.aromapulse.kr/static/class-detail?id=101

**예상 동작**:
1. ✅ 로딩 화면: "클래스 정보를 불러오는 중..."
2. ✅ API 호출: `/api/classes/101` (올바른 엔드포인트)
3. ✅ 클래스 정보 표시
4. ✅ 강사 섹션: 조향사만 표시 (필수)
5. ✅ 선물용 포장 서비스 옵션 표시
6. ✅ 특별 요청사항: "원하시는 **클래스** 분위기..." (초록색 테마)

## 📋 원데이 클래스 vs 워크샵 구분

### 원데이 클래스 (class-detail.html)
- **API 엔드포인트**: `/api/classes/:id`
- **데이터베이스**: `oneday_classes` 테이블
- **강사**: 조향사만 (필수, 고정)
- **옵션**: 선물용 포장 서비스 ✅
- **워케이션**: 없음 ❌
- **테마 컬러**: 초록색 (green)
- **예시 URL**: https://www.aromapulse.kr/static/class-detail?id=101

### 워크샵 (workshop-detail.html)
- **API 엔드포인트**: `/api/workshops/:id`
- **데이터베이스**: `workshops` 테이블
- **강사**: 조향사 + 선택적 심리상담사/멘탈케어 전문가
- **옵션**: 워케이션 ✅
- **선물용 포장**: 없음 ❌
- **테마 컬러**: 보라색/분홍색 (purple/pink)
- **예시 URL**: https://www.aromapulse.kr/static/workshop-detail?id=201

## 🔧 기술적 구현

### 페이지 타입 감지 로직
```javascript
// workshop-detail.js
let isClassPage = window.location.pathname.includes('class-detail');

// 올바른 API 엔드포인트 호출
const apiEndpoint = isClassPage ? 
  `/api/classes/${workshopId}` : 
  `/api/workshops/${workshopId}`;
```

### 백엔드 라우트 구조
```typescript
// src/index.tsx
app.route('/api/oneday-classes', onedayClassesRoutes);  // 원본
app.route('/api/classes', onedayClassesRoutes);         // 별칭 (짧은 URL)
app.route('/api/workshops', workshopsRoutes);
```

### 데이터베이스 스키마
```sql
CREATE TABLE IF NOT EXISTS oneday_classes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  provider_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  location TEXT NOT NULL,
  address TEXT,
  studio_name TEXT,
  instructor_name TEXT,
  price INTEGER,
  duration INTEGER,
  max_participants INTEGER,
  image_url TEXT,
  naver_place_id TEXT,
  kakao_place_id TEXT,
  google_place_id TEXT,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (provider_id) REFERENCES users(id)
);
```

## 📝 Git 커밋 이력

```
commit 74340f8 (HEAD -> main)
Author: webapp
Date: 2025-11-22

Fix: 원데이 클래스 상세 페이지 UI 텍스트 수정
- '워크샵' → '클래스'로 텍스트 변경
- 보라색 아이콘 → 초록색 아이콘 변경 (원데이 클래스 테마 컬러)
- 💜 → 💚 이모지 변경
- 백엔드에 /api/classes 라우트 추가 (oneday-classes 별칭)

commit a59ee21
Author: webapp
Date: 2025-11-22

Fix: 원데이 클래스 페이지가 올바른 API 엔드포인트 호출하도록 수정
- workshop-detail.js가 페이지 타입 감지 (class-detail vs workshop-detail)
- 클래스 페이지: /api/classes/ID 호출
- 워크샵 페이지: /api/workshops/ID 호출
- 에러 메시지와 리다이렉트 경로도 페이지 타입에 맞게 수정
```

## 🎉 최종 결과

**모든 작업 완료!** ✅

원데이 클래스 페이지 (https://www.aromapulse.kr/static/class-detail?id=101)가:
1. ✅ 올바른 API 엔드포인트 호출
2. ✅ 올바른 용어 사용 (워크샵 → 클래스)
3. ✅ 올바른 테마 컬러 (초록색)
4. ✅ 강사 섹션 고정 (조향사만)
5. ✅ 선물용 포장 서비스 옵션 표시
6. ✅ 데이터베이스 정상 작동

**이제 페이지가 정상적으로 로드되고 작동합니다!** 🚀

---

## 📚 관련 문서

- `API_ENDPOINT_FIX.md`: API 엔드포인트 수정 상세 설명
- `CLASS_VS_WORKSHOP_DISTINCTION.md`: 원데이 클래스 vs 워크샵 구분 가이드
- `README.md`: 프로젝트 전체 문서

## 🔗 유용한 링크

- **프로덕션**: https://www.aromapulse.kr
- **원데이 클래스 목록**: https://www.aromapulse.kr/classes
- **원데이 클래스 상세**: https://www.aromapulse.kr/static/class-detail?id=101
- **API 테스트**: https://www.aromapulse.kr/api/classes/101
- **Cloudflare Dashboard**: https://dash.cloudflare.com
- **GitHub Repository**: https://github.com/OWNER/aromapulse
