# JWT Token Verification Error Fix

## 🐛 문제 상황

**오류 메시지**: 
```
프로필 업데이트 실패
Token verification failed: Invalid signature
```

## 🔍 원인 분석

### 1. JWT 토큰 서명 불일치
- **로컬 환경**에서 생성된 JWT 토큰과 **프로덕션 환경**의 JWT_SECRET이 다를 경우 발생
- 사용자가 로컬 개발 환경에서 로그인 → 프로덕션 URL 접속 시 토큰 검증 실패
- 또는 프로덕션 환경의 JWT_SECRET이 변경된 경우

### 2. 문제가 되는 시나리오
```
1. 로컬 개발 (localhost:3000) 로그인
   └─> auth_token 쿠키에 로컬 JWT_SECRET으로 생성된 토큰 저장

2. 프로덕션 (aromapulse.pages.dev) 접속
   └─> 브라우저가 같은 쿠키를 사용하려 시도
   └─> 프로덕션 JWT_SECRET으로 검증 시도
   └─> ❌ Invalid signature 오류 발생
```

### 3. 에러 발생 위치
- **Backend**: `/src/routes/user.ts` Line 86-87
  ```typescript
  const tokenData = await verifyToken(token, c.env.JWT_SECRET);
  ```
- **JWT Util**: `/src/utils/jwt.ts` Line 42-44
  ```typescript
  const expectedSignature = await sign(`${encodedHeader}.${encodedPayload}`, secret);
  if (signature !== expectedSignature) {
    throw new Error('Invalid signature');
  }
  ```

## ✅ 해결 방법

### 1. 백엔드: 자동 로그아웃 처리

**파일**: `/src/routes/user.ts`

```typescript
// Line 101-109
} catch (error: any) {
  console.error('❌ Token verification failed:', error.message);
  console.error('Error stack:', error.stack);
  
  // 🔑 토큰 검증 실패 시 쿠키 삭제 (자동 로그아웃)
  c.header('Set-Cookie', 'auth_token=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax');
  
  return c.json({ 
    error: '토큰 인증 실패: ' + error.message,
    autoLogout: true  // 프론트엔드에서 로그아웃 처리하도록 플래그 추가
  }, 401);
}
```

**변경 내용**:
- ✅ 토큰 검증 실패 시 `auth_token` 쿠키 자동 삭제
- ✅ `autoLogout: true` 플래그로 프론트엔드에 알림
- ✅ 401 Unauthorized 상태 코드 반환

### 2. 프론트엔드: 401 에러 시 자동 리다이렉트

**파일**: `/public/static/mypage.js`

#### A. 프로필 정보 로드 시 (Line 103-117)
```javascript
if (!response.ok) {
  const errorText = await response.text();
  console.error('[loadUserInfo] API 실패:', response.status, errorText);
  
  // 🔑 401 Unauthorized - 토큰 인증 실패 시 로그아웃
  if (response.status === 401) {
    console.warn('[loadUserInfo] 토큰 인증 실패 - 자동 로그아웃');
    alert('⚠️ 로그인 세션이 만료되었습니다.\n다시 로그인해주세요.');
    document.cookie = 'auth_token=; Path=/; Max-Age=0';
    window.location.href = '/login';
    return;
  }
  // ... 기존 폴백 로직
}
```

#### B. 프로필 업데이트 시 (Line 373-388)
```javascript
} catch (error) {
  console.error('❌ 프로필 업데이트 실패:', error);
  
  // 🔑 토큰 인증 실패 시 자동 로그아웃
  if (error.message && error.message.includes('토큰 인증 실패')) {
    alert('⚠️ 로그인 세션이 만료되었습니다.\n다시 로그인해주세요.');
    // 쿠키 삭제
    document.cookie = 'auth_token=; Path=/; Max-Age=0';
    // 로그인 페이지로 리다이렉트
    window.location.href = '/login';
    return;
  }
  
  // 기존 에러 메시지 표시
  const errorMessage = error.message || '알 수 없는 오류가 발생했습니다';
  alert(`❌ 프로필 업데이트 실패\n\n${errorMessage}`);
}
```

## 🎯 적용 효과

### Before (수정 전)
```
1. 사용자가 프로필 업데이트 시도
   └─> ❌ "Token verification failed: Invalid signature" 오류
   └─> 🔴 사용자는 계속 같은 오류 발생
   └─> 😡 좌절감 증가
```

### After (수정 후)
```
1. 사용자가 프로필 업데이트 시도
   └─> ⚠️ "로그인 세션이 만료되었습니다" 메시지
   └─> 🔄 자동으로 쿠키 삭제
   └─> ➡️ 로그인 페이지로 자동 이동
   └─> ✅ 재로그인 후 정상 사용
```

## 📊 테스트 시나리오

### 시나리오 1: 로컬 → 프로덕션 토큰 충돌
1. 로컬 환경 (localhost:3000)에서 로그인
2. 프로덕션 URL (aromapulse.pages.dev)로 접속
3. 프로필 페이지 (/mypage) 접근
4. **예상 결과**: 자동으로 로그인 페이지로 리다이렉트

### 시나리오 2: 만료된 토큰
1. 프로덕션에서 로그인 후 7일 경과
2. 프로필 업데이트 시도
3. **예상 결과**: "세션 만료" 메시지 + 자동 로그아웃

### 시나리오 3: JWT_SECRET 변경
1. 관리자가 프로덕션 JWT_SECRET 업데이트
2. 기존 사용자가 페이지 접속
3. **예상 결과**: 자동 로그아웃 + 재로그인 요청

## 🚀 배포 정보

- **Production URL**: https://7d53efcc.aromapulse.pages.dev
- **GitHub Commit**: `6794a2e`
- **Deployment Date**: 2025-11-24
- **Status**: ✅ Live

## 💡 사용자 안내

### 현재 오류가 발생한 사용자를 위한 해결 방법

**즉시 해결 방법**:
1. 브라우저에서 **쿠키 삭제**:
   - Chrome/Edge: F12 → Application → Cookies → `auth_token` 삭제
   - Firefox: F12 → Storage → Cookies → `auth_token` 삭제
   
2. 또는 **시크릿/프라이빗 모드**로 접속

3. **다시 로그인**

**이제는**:
- 위 작업을 수동으로 할 필요 없음
- 자동으로 로그아웃 처리됨
- 사용자에게 명확한 안내 메시지 표시

## 🔐 보안 개선사항

1. **쿠키 자동 정리**: 유효하지 않은 토큰이 브라우저에 남아있지 않음
2. **명확한 에러 메시지**: 사용자가 문제를 이해하기 쉬움
3. **자동 리다이렉트**: UX 개선 및 보안 강화

## 📝 추가 권장사항

### 1. JWT_SECRET 관리
```bash
# 프로덕션 환경의 JWT_SECRET 확인
npx wrangler pages secret list --project-name aromapulse

# 필요 시 업데이트 (모든 사용자 재로그인 필요)
npx wrangler pages secret put JWT_SECRET --project-name aromapulse
```

### 2. 토큰 만료 시간
현재: 7일
```typescript
// src/utils/jwt.ts Line 20
exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60)
```

변경 고려사항:
- **더 짧게**: 보안 강화 (예: 1일)
- **더 길게**: 사용자 편의성 (예: 30일)

### 3. 리프레시 토큰 도입 (향후 개선)
- Access Token: 짧은 만료 시간 (1시간)
- Refresh Token: 긴 만료 시간 (30일)
- 자동 토큰 갱신 메커니즘

## ✅ 결론

JWT 토큰 검증 실패 시 사용자가 계속 같은 오류를 겪지 않도록, **자동 로그아웃 및 재로그인 유도** 메커니즘을 구현했습니다.

이제 사용자는:
- ✅ 명확한 안내 메시지를 받음
- ✅ 자동으로 로그인 페이지로 이동
- ✅ 재로그인만 하면 정상 사용 가능

---

**작성일**: 2025-11-24  
**작성자**: AI Development Assistant  
**버전**: 1.0
