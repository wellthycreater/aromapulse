# 🧪 로컬 테스트 환경 가이드

## 🌐 테스트 URL

**로컬 개발 서버**: https://3000-ixw6l6ek5pa4nw2e7gi09-c07dda5e.sandbox.novita.ai

## 👤 테스트 계정

### B2C 테스트 계정
- **이메일**: `b2c@test.com`
- **비밀번호**: `test1234`
- **사용자 유형**: B2C (일반 고객)
- **이름**: B2C 테스트

### B2B 테스트 계정
- **이메일**: `b2b@test.com`
- **비밀번호**: `test1234`
- **사용자 유형**: B2B (기업 고객)
- **이름**: B2B 테스트

### 관리자 계정
- **이메일**: `admin@test.com`
- **비밀번호**: `admin1234`
- **사용자 유형**: B2B (관리자 권한)
- **이름**: 아로마펄스 관리자

## 🧪 테스트 시나리오

### 시나리오 1: B2C 사용자 워크샵 접근 차단 테스트

1. **로그인**
   - URL: https://3000-ixw6l6ek5pa4nw2e7gi09-c07dda5e.sandbox.novita.ai/login
   - 이메일: `b2c@test.com`
   - 비밀번호: `test1234`

2. **워크샵 페이지 접근**
   - URL: https://3000-ixw6l6ek5pa4nw2e7gi09-c07dda5e.sandbox.novita.ai/workshops
   - **예상 결과**: ❌ "B2B 전용 서비스" 메시지 표시

3. **확인 사항**
   - [ ] 잠금 아이콘 표시
   - [ ] "B2B 전용 서비스" 제목
   - [ ] B2B 회원 설명
   - [ ] B2B 회원가입 버튼
   - [ ] 로그인 링크
   - [ ] 대시보드로 돌아가기 링크

---

### 시나리오 2: B2B 사용자 워크샵 접근 허용 테스트

1. **로그아웃** (상단 메뉴에서)

2. **B2B 계정으로 로그인**
   - URL: https://3000-ixw6l6ek5pa4nw2e7gi09-c07dda5e.sandbox.novita.ai/login
   - 이메일: `b2b@test.com`
   - 비밀번호: `test1234`

3. **워크샵 페이지 접근**
   - URL: https://3000-ixw6l6ek5pa4nw2e7gi09-c07dda5e.sandbox.novita.ai/workshops
   - **예상 결과**: ✅ 워크샵 목록 표시

4. **확인 사항**
   - [ ] Hero 섹션 표시 (파란색 배경)
   - [ ] 검색 바 표시
   - [ ] 카테고리 필터 (캔들, 디퓨저, 향수 등)
   - [ ] 가격 필터
   - [ ] 3개의 테스트 워크샵 표시
     - 라벤더 캔들 만들기 클래스 (45,000원)
     - 천연 디퓨저 만들기 (55,000원)
     - 나만의 향수 만들기 (85,000원)

---

### 시나리오 3: 관리자 클래스 등록 테스트

1. **관리자 로그인**
   - URL: https://3000-ixw6l6ek5pa4nw2e7gi09-c07dda5e.sandbox.novita.ai/admin-login
   - 이메일: `admin@test.com`
   - 비밀번호: `admin1234`

2. **관리자 페이지 접속**
   - URL: https://3000-ixw6l6ek5pa4nw2e7gi09-c07dda5e.sandbox.novita.ai/static/admin-products

3. **클래스 등록**
   - "클래스 관리" 탭 클릭
   - "클래스 등록" 버튼 클릭
   - 클래스 정보 입력:
     - 클래스명: 테스트 클래스
     - 카테고리: 섬유 탈취제 만들기
     - 지역: 서울
     - 가격: 50000
     - 소요 시간: 120
     - 최대 인원: 10
   - 이미지 업로드 (선택, 500KB 이하)
   - "저장" 버튼 클릭

4. **B2B 계정으로 확인**
   - 로그아웃 후 B2B 계정으로 재로그인
   - 워크샵 페이지에서 등록한 클래스 확인

---

### 시나리오 4: 이미지 업로드 테스트

1. **관리자로 로그인**

2. **클래스 등록 모달 열기**

3. **이미지 업로드**
   - 500KB 이하 이미지 선택
   - "업로드" 버튼 클릭
   - **예상 결과**: ✅ 이미지 미리보기 표시

4. **클래스 저장 및 확인**
   - 클래스 저장
   - 워크샵 페이지에서 이미지 표시 확인

---

## 📊 전체 테스트 체크리스트

### ✅ 접근 제어
- [ ] B2C 사용자: 워크샵 접근 차단
- [ ] B2B 사용자: 워크샵 접근 허용
- [ ] 비로그인: 워크샵 접근 차단

### ✅ 관리자 기능
- [ ] 클래스 등록
- [ ] 클래스 수정
- [ ] 클래스 삭제
- [ ] 이미지 업로드 (500KB 제한)

### ✅ 사용자 기능
- [ ] 클래스 목록 조회
- [ ] 검색 기능
- [ ] 카테고리 필터
- [ ] 가격 필터

### ✅ 카테고리
- [ ] 캔들 만들기
- [ ] 디퓨저 만들기
- [ ] 향수 만들기
- [ ] 룸스프레이 만들기
- [ ] 섬유향수 만들기
- [ ] 섬유 탈취제 만들기 ⭐ NEW
- [ ] 아로마테라피 기초
- [ ] 기타

## 🔗 주요 URL 모음

| 페이지 | URL |
|--------|-----|
| 메인 | https://3000-ixw6l6ek5pa4nw2e7gi09-c07dda5e.sandbox.novita.ai |
| 로그인 | https://3000-ixw6l6ek5pa4nw2e7gi09-c07dda5e.sandbox.novita.ai/login |
| 회원가입 | https://3000-ixw6l6ek5pa4nw2e7gi09-c07dda5e.sandbox.novita.ai/signup |
| 대시보드 | https://3000-ixw6l6ek5pa4nw2e7gi09-c07dda5e.sandbox.novita.ai/dashboard |
| 워크샵 | https://3000-ixw6l6ek5pa4nw2e7gi09-c07dda5e.sandbox.novita.ai/workshops |
| 관리자 로그인 | https://3000-ixw6l6ek5pa4nw2e7gi09-c07dda5e.sandbox.novita.ai/admin-login |
| 관리자 페이지 | https://3000-ixw6l6ek5pa4nw2e7gi09-c07dda5e.sandbox.novita.ai/static/admin-products |

## 💡 팁

- 로컬 환경은 실시간으로 업데이트됩니다
- 데이터베이스는 `.wrangler/state/v3/d1/`에 SQLite로 저장됩니다
- 테스트 중 문제가 발생하면 `npm run db:reset` 명령으로 DB 초기화 가능

