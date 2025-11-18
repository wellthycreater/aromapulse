# 프로덕션 테스트 계정 생성 가이드

## ⚠️ 문제
- 프로덕션 DB에는 테스트 계정이 없음
- wrangler CLI로 프로덕션 DB 직접 접근 불가 (API 권한 문제)

## ✅ 해결 방법

### 방법 1: 회원가입으로 계정 생성 (가장 간단)

#### B2C 테스트 계정 만들기
1. https://www.aromapulse.kr/signup 접속
2. **사용자 유형**: B2C 선택
3. 이메일: 원하는 이메일 입력 (예: mytest@example.com)
4. 비밀번호: 원하는 비밀번호 입력
5. 이름, 전화번호 입력
6. B2C 세부 분류 선택
7. 회원가입 완료

#### B2B 테스트 계정 만들기
1. https://www.aromapulse.kr/signup 접속
2. **사용자 유형**: B2B 선택
3. 이메일: 원하는 이메일 입력 (예: mybiz@example.com)
4. 비밀번호: 원하는 비밀번호 입력
5. 이름, 전화번호 입력
6. B2B 유형 선택 (조향사, 기업, 가게, 독립사업자)
7. 사업체 정보 입력
8. 회원가입 완료

### 방법 2: Cloudflare Dashboard에서 SQL 실행

**주의**: 비밀번호는 bcrypt 해시가 필요하므로 이 방법은 복잡합니다.
대신 **방법 1 (회원가입)**을 권장합니다.

1. Cloudflare Dashboard 접속
2. Workers & Pages → D1 → aromapulse-production
3. Console 탭에서 SQL 실행
4. 비밀번호 해시 생성 필요 (별도 도구 필요)

## 🧪 테스트 시나리오

### B2C 계정 테스트
1. B2C 계정으로 로그인
2. https://www.aromapulse.kr/workshops 접속
3. **예상 결과**: "B2B 전용 서비스" 메시지 표시 ✅

### B2B 계정 테스트
1. B2B 계정으로 로그인
2. https://www.aromapulse.kr/workshops 접속
3. **예상 결과**: 워크샵 목록 표시 ✅

### 관리자 테스트
1. 관리자 계정으로 로그인
2. https://www.aromapulse.kr/static/admin-products 접속
3. "클래스 관리" 탭 클릭
4. 클래스 등록
5. B2B 계정으로 워크샵 페이지에서 확인

## 📝 참고

- 로컬 개발 환경에는 이미 테스트 계정이 있음
- 프로덕션은 실제 사용자가 회원가입해야 함
- 관리자 계정은 별도로 생성 필요 (Cloudflare Dashboard)
