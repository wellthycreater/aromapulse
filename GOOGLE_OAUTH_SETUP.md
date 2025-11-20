# 구글 로그인 설정 가이드

## 🎯 목표
아로마펄스 웹사이트에 구글 로그인 기능을 추가합니다.

---

## ✅ 사전 준비 사항

### 1. 코드 구현 상태
```
✅ OAuth 플로우 코드: /home/user/webapp/src/routes/auth.ts (라인 350-449)
✅ OAuth 유틸리티: /home/user/webapp/src/utils/oauth.ts
✅ 로그인 페이지: /home/user/webapp/public/static/login.html
```

### 2. Cloudflare Pages Secrets
```
✅ GOOGLE_CLIENT_ID: Value Encrypted
✅ GOOGLE_CLIENT_SECRET: Value Encrypted
✅ GOOGLE_CALLBACK_URL: Value Encrypted
```

### 3. 필요한 정보
```
📍 Redirect URI: https://www.aromapulse.kr/api/auth/google/callback
🌐 승인된 도메인: www.aromapulse.kr
```

---

## 📋 Google Cloud Console 설정 단계

### Step 1: Google Cloud Console 접속

1. **Google Cloud Console**에 접속:
   ```
   https://console.cloud.google.com/
   ```

2. **구글 계정으로 로그인**

---

### Step 2: 프로젝트 생성 또는 선택

#### 옵션 A: 기존 프로젝트가 있는 경우
1. 상단의 **프로젝트 선택** 드롭다운 클릭
2. 사용할 프로젝트 선택

#### 옵션 B: 새 프로젝트 생성
1. 상단의 **프로젝트 선택** 드롭다운 클릭
2. **새 프로젝트** 버튼 클릭
3. 프로젝트 정보 입력:
   ```
   프로젝트 이름: aromapulse (또는 원하는 이름)
   조직: (선택사항)
   ```
4. **만들기** 버튼 클릭

---

### Step 3: OAuth 동의 화면 설정

1. **좌측 메뉴**에서 **API 및 서비스** → **OAuth 동의 화면** 클릭

2. **User Type 선택**:
   ```
   ⦿ 외부 (External) - 일반 사용자용 (추천)
   ○ 내부 (Internal) - 조직 내부 전용
   ```
   **"외부"** 선택 후 **만들기** 클릭

3. **앱 정보 입력** (1단계):
   ```
   앱 이름: 아로마펄스 (또는 AromaPulse)
   사용자 지원 이메일: (본인 이메일 선택)
   앱 로고: (선택사항)
   ```

4. **앱 도메인** (선택사항):
   ```
   애플리케이션 홈페이지: https://www.aromapulse.kr
   개인정보처리방침: https://www.aromapulse.kr/privacy (있다면)
   서비스 약관: https://www.aromapulse.kr/terms (있다면)
   ```

5. **승인된 도메인**:
   ```
   ✅ 추가할 도메인: aromapulse.kr
   ```
   **도메인 추가** 버튼 클릭

6. **개발자 연락처 정보**:
   ```
   이메일 주소: (본인 이메일 입력)
   ```

7. **저장 후 계속** 클릭

8. **범위 설정** (2단계):
   - **범위 추가 또는 삭제** 버튼 클릭
   - 다음 범위 선택:
     ```
     ✅ .../auth/userinfo.email - 이메일 주소 보기
     ✅ .../auth/userinfo.profile - 개인정보(공개로 설정한 정보 포함) 보기
     ✅ openid - Google에서 내 개인 정보를 사용자와 연결
     ```
   - **업데이트** 클릭
   - **저장 후 계속** 클릭

9. **테스트 사용자** (3단계):
   - 개발 단계에서는 테스트 사용자 추가 필요
   - **ADD USERS** 버튼 클릭
   - 테스트할 구글 계정 이메일 입력
   - **저장 후 계속** 클릭

10. **요약** (4단계):
    - 설정 내용 확인
    - **대시보드로 돌아가기** 클릭

---

### Step 4: OAuth 클라이언트 ID 생성

1. **좌측 메뉴**에서 **API 및 서비스** → **사용자 인증 정보** 클릭

2. 상단의 **+ 사용자 인증 정보 만들기** 클릭

3. **OAuth 클라이언트 ID** 선택

4. **애플리케이션 유형**:
   ```
   ⦿ 웹 애플리케이션
   ```

5. **이름**:
   ```
   아로마펄스 웹 클라이언트 (또는 원하는 이름)
   ```

6. **승인된 자바스크립트 원본** (선택사항):
   ```
   https://www.aromapulse.kr
   ```
   **URI 추가** 버튼으로 추가

7. **승인된 리디렉션 URI** (필수!):
   ```
   https://www.aromapulse.kr/api/auth/google/callback
   ```
   **URI 추가** 버튼으로 추가
   
   ⚠️ **중요**: 정확히 이 URL을 입력해야 합니다!
   - 프로토콜: `https://`
   - 도메인: `www.aromapulse.kr`
   - 경로: `/api/auth/google/callback`

8. **만들기** 버튼 클릭

9. **OAuth 클라이언트 생성됨** 팝업:
   ```
   클라이언트 ID: 123456789-abc...apps.googleusercontent.com
   클라이언트 보안 비밀: GOCSPX-...
   ```
   ⚠️ **이 정보를 복사해서 안전한 곳에 보관하세요!**
   
   - **JSON 다운로드** 버튼으로 파일 저장 (권장)
   - 또는 직접 복사

---

## 🔐 Cloudflare Pages Secrets 업데이트

다음 명령어로 새로운 구글 인증 정보를 등록하세요:

```bash
# Google Client ID 등록
npx wrangler pages secret put GOOGLE_CLIENT_ID --project-name aromapulse
# 입력 프롬프트에서: 123456789-abc...apps.googleusercontent.com 붙여넣기

# Google Client Secret 등록
npx wrangler pages secret put GOOGLE_CLIENT_SECRET --project-name aromapulse
# 입력 프롬프트에서: GOCSPX-... 붙여넣기

# Google Callback URL 등록 (이미 있다면 스킵)
npx wrangler pages secret put GOOGLE_CALLBACK_URL --project-name aromapulse
# 입력 프롬프트에서: https://www.aromapulse.kr/api/auth/google/callback
```

### 등록 확인
```bash
npx wrangler pages secret list --project-name aromapulse
```

---

## 🧪 테스트

### 1. 로그인 페이지 접속
```
https://www.aromapulse.kr/login
```

### 2. 구글 로그인 버튼 클릭

### 3. 구글 계정 선택 및 인증

### 4. 권한 동의:
   - 이메일 주소 보기
   - 프로필 정보 보기

### 5. 홈페이지로 리다이렉트 확인

---

## ⚠️ 중요 사항

### 1. 테스트 모드 vs 프로덕션 모드

**현재 상태: 테스트 모드**
- OAuth 동의 화면이 "테스트" 상태
- 추가된 테스트 사용자만 로그인 가능
- 일반 사용자는 로그인 불가

**프로덕션 배포 시:**
1. Google Cloud Console → **OAuth 동의 화면**
2. **앱 게시** 버튼 클릭
3. Google 검토 프로세스 진행 (수 일 ~ 수 주 소요)
4. 승인 후 모든 사용자가 로그인 가능

### 2. Redirect URI 정확성
- **반드시 정확히 일치**해야 합니다
- 프로토콜, 도메인, 경로 모두 정확히 입력
- 잘못된 경우: `redirect_uri_mismatch` 에러 발생

### 3. 승인된 도메인
- `aromapulse.kr` (서브도메인 제외)
- 도메인 소유권 확인 필요할 수 있음

---

## 🐛 문제 해결

### "redirect_uri_mismatch" 에러
**원인**: Redirect URI가 Google Cloud Console 설정과 일치하지 않음

**해결**:
1. Google Cloud Console → **사용자 인증 정보** 확인
2. OAuth 클라이언트 ID 클릭
3. **승인된 리디렉션 URI**에 정확한 URL 추가:
   ```
   https://www.aromapulse.kr/api/auth/google/callback
   ```

### "Access blocked: This app's request is invalid"
**원인**: OAuth 동의 화면 설정 미완료

**해결**:
1. Google Cloud Console → **OAuth 동의 화면**
2. 모든 필수 정보 입력 완료
3. 범위(Scope) 올바르게 설정

### "This app isn't verified"
**원인**: 앱이 아직 Google 검토를 받지 않음 (정상)

**해결**:
- 테스트 단계: **고급** → **아로마펄스(으)로 이동(안전하지 않음)** 클릭
- 프로덕션: Google 검토 신청

### "400: invalid_client"
**원인**: Client ID 또는 Client Secret이 잘못됨

**해결**:
1. Google Cloud Console에서 올바른 값 확인
2. Cloudflare Pages Secrets 업데이트:
   ```bash
   npx wrangler pages secret put GOOGLE_CLIENT_ID --project-name aromapulse
   npx wrangler pages secret put GOOGLE_CLIENT_SECRET --project-name aromapulse
   ```

---

## 📊 필요한 정보 정리

### Cloudflare에 등록할 값:
```bash
GOOGLE_CLIENT_ID=<Google Cloud Console에서 발급받은 Client ID>
GOOGLE_CLIENT_SECRET=<Google Cloud Console에서 발급받은 Client Secret>
GOOGLE_CALLBACK_URL=https://www.aromapulse.kr/api/auth/google/callback
```

### Google Cloud Console에 등록할 값:
```
승인된 도메인: aromapulse.kr
승인된 자바스크립트 원본: https://www.aromapulse.kr
승인된 리디렉션 URI: https://www.aromapulse.kr/api/auth/google/callback
```

---

## 📝 참고 자료

- [Google OAuth 2.0 문서](https://developers.google.com/identity/protocols/oauth2)
- [Google Cloud Console](https://console.cloud.google.com/)
- [OAuth 동의 화면 설정](https://support.google.com/cloud/answer/10311615)

---

## ✅ 체크리스트

설정 완료 시 체크하세요:

- [ ] Google Cloud 프로젝트 생성/선택
- [ ] OAuth 동의 화면 설정 완료
- [ ] OAuth 클라이언트 ID 생성 완료
- [ ] Client ID 및 Client Secret 복사
- [ ] Redirect URI 정확히 등록
- [ ] 승인된 도메인 추가
- [ ] Cloudflare Pages Secrets 업데이트
- [ ] 테스트 사용자 추가 (테스트 단계)
- [ ] 프로덕션 환경에서 로그인 테스트

---

## 🚀 다음 단계

1. Google Cloud Console 설정 완료
2. Client ID와 Client Secret를 Cloudflare에 등록
3. 프로덕션 환경에서 구글 로그인 테스트
4. 모든 OAuth 제공자(네이버, 카카오, 구글) 통합 완료!
