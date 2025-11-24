# JWT System Unification - Critical Bug Fix

## 🚨 심각한 문제 발견

### 증상
- 로그아웃 후 다시 로그인해도 "로그인 세션이 만료되었습니다" 메시지 발생
- OAuth (카카오/구글/네이버) 로그인 후 프로필 페이지 접근 시 즉시 401 에러
- "Token verification failed: Invalid signature" 오류 지속

## 🔍 근본 원인

프로젝트 내에 **두 개의 서로 다른 JWT 시스템**이 공존하고 있었습니다:

### 1. JWTManager (`/src/lib/auth/jwt.ts`)
**사용처**: OAuth 로그인 시 토큰 생성
- `auth.ts` - 카카오/구글/네이버 OAuth 콜백
- `bookings.ts` - 예약 관련 API
- `workshop-quotes.ts` - 워크샵 견적 API

```typescript
const jwtManager = new JWTManager(JWT_SECRET);
const token = await jwtManager.sign({ userId, email, name, provider });
```

### 2. verifyToken (`/src/utils/jwt.ts`)
**사용처**: 프로필 API에서 토큰 검증
- `user.ts` - 프로필 조회/수정 API

```typescript
const tokenData = await verifyToken(token, JWT_SECRET);
```

## ⚠️ 문제점

이 두 시스템은 **내부 구현이 달라서 서로 호환되지 않습니다**:

### JWTManager 구현
```typescript
// Base64 URL encode - unescape/encodeURIComponent 사용
private base64UrlEncode(str: string): string {
  const base64 = btoa(unescape(encodeURIComponent(str)));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}
```

### verifyToken 구현
```typescript
// Base64 URL encode - TextEncoder 사용
function base64urlEncode(input: string | ArrayBuffer): string {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(input);
  str = btoa(String.fromCharCode(...bytes));
  return str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}
```

**결과**: 
1. OAuth 로그인 시 JWTManager로 토큰 생성 ✅
2. 프로필 API 호출 시 verifyToken으로 검증 시도 ❌
3. 서명 불일치로 **항상 실패** 🚨

## ✅ 해결 방법

**user.ts를 JWTManager로 통일**

### Before (문제 코드)
```typescript
import { verifyToken } from '../utils/jwt';

// 인증 미들웨어
const tokenData = await verifyToken(token, c.env.JWT_SECRET);

// 프로필 업데이트 후 토큰 재생성
const { generateToken } = await import('../utils/jwt');
const newToken = await generateToken(updatedUser, c.env.JWT_SECRET);
```

### After (수정 코드)
```typescript
import { JWTManager } from '../lib/auth/jwt';

// 인증 미들웨어
const jwtManager = new JWTManager(c.env.JWT_SECRET);
const tokenData = await jwtManager.verify(token);

// 프로필 업데이트 후 토큰 재생성
const jwtManager = new JWTManager(c.env.JWT_SECRET);
const newToken = await jwtManager.sign({
  userId: updatedUser.id,
  email: updatedUser.email,
  name: updatedUser.name,
  provider: updatedUser.oauth_provider || 'kakao'
});
```

## 📝 변경 사항

### 파일: `/src/routes/user.ts`

1. **Import 변경**
```typescript
- import { verifyToken } from '../utils/jwt';
+ import { JWTManager } from '../lib/auth/jwt';
```

2. **인증 미들웨어 (Line 85-106)**
```typescript
try {
  // JWT 토큰 검증 (JWTManager 사용)
  const jwtManager = new JWTManager(c.env.JWT_SECRET);
  const tokenData = await jwtManager.verify(token);
  
  if (!tokenData || !tokenData.userId) {
    console.error('❌ Invalid token data:', tokenData);
    
    // 토큰 검증 실패 시 쿠키 삭제 (자동 로그아웃)
    c.header('Set-Cookie', 'auth_token=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax');
    
    return c.json({ 
      error: '유효하지 않은 토큰입니다',
      autoLogout: true
    }, 401);
  }
  
  console.log('✅ Token verified successfully:', { userId: tokenData.userId });
  
  c.set('userId', tokenData.userId);
  c.set('userEmail', tokenData.email);
  
  await next();
}
```

3. **프로필 업데이트 후 토큰 재생성 (Line 322-330)**
```typescript
// 업데이트된 사용자 정보로 새 JWT 토큰 생성 (JWTManager 사용)
const jwtManager = new JWTManager(c.env.JWT_SECRET);
const newToken = await jwtManager.sign({
  userId: updatedUser.id as number,
  email: updatedUser.email as string,
  name: updatedUser.name as string,
  provider: (updatedUser.oauth_provider as 'google' | 'naver' | 'kakao') || 'kakao'
});

return c.json({ 
  message: '프로필이 성공적으로 업데이트되었습니다',
  user: updatedUser,
  token: newToken
});
```

## 🎯 테스트 시나리오

### 1. OAuth 로그인 테스트
```
1. 카카오/구글/네이버 중 하나로 로그인
2. 마이페이지 접속
3. ✅ 정상적으로 프로필 정보 표시
4. 프로필 정보 수정
5. ✅ 성공 메시지와 함께 업데이트 완료
```

### 2. 세션 만료 테스트
```
1. 로그인 후 30일 경과
2. 마이페이지 접속
3. ✅ "로그인 세션이 만료되었습니다" 메시지
4. ✅ 자동으로 로그인 페이지로 이동
```

### 3. 크로스 체크
```
1. 로그인 후 개발자 도구에서 auth_token 쿠키 복사
2. JWT 디코더(jwt.io)로 페이로드 확인
3. ✅ provider, userId, email 등 정보 확인 가능
```

## 📊 영향받는 API 엔드포인트

### 이제 정상 작동하는 API들:
- ✅ `GET /api/user/profile` - 프로필 조회
- ✅ `PUT /api/user/profile` - 프로필 수정
- ✅ `PUT /api/user/change-password` - 비밀번호 변경
- ✅ `POST /api/user/profile-image` - 프로필 이미지 업로드
- ✅ `DELETE /api/user/profile-image` - 프로필 이미지 삭제

### 계속 정상 작동하는 API들:
- ✅ OAuth 로그인 (`/auth/google/callback`, `/auth/kakao/callback`, `/auth/naver/callback`)
- ✅ 예약 API (`/api/bookings/*`)
- ✅ 워크샵 견적 API (`/api/workshop-quotes/*`)

## 🚀 배포 정보

- **Production URL**: https://41e5fed9.aromapulse.pages.dev
- **GitHub Commit**: `1b9bcd0`
- **Deployment Date**: 2025-11-24
- **Status**: ✅ Live and Tested

## 💡 교훈

### 1. 단일 JWT 시스템 사용
- ✅ **DO**: 프로젝트 전체에서 하나의 JWT 라이브러리만 사용
- ❌ **DON'T**: 같은 목적으로 여러 구현체 혼용

### 2. 통합 테스트의 중요성
- 로그인과 프로필 API를 함께 테스트했다면 조기 발견 가능
- E2E 테스트 자동화 필요

### 3. 코드 리뷰 포인트
- import 문에서 같은 기능의 다른 모듈 사용 여부 확인
- JWT 생성/검증 로직의 일관성 검증

## 🔮 향후 개선사항

### 1. `/src/utils/jwt.ts` 제거
현재는 하위 호환성을 위해 유지하지만, 점진적으로 제거 예정:
```typescript
// 모든 곳에서 이것만 사용:
import { JWTManager } from '../lib/auth/jwt';
```

### 2. 타입 안정성 강화
```typescript
// JWTPayload 타입을 전역 타입으로 export
import type { JWTPayload } from '../lib/auth/jwt';
```

### 3. 리프레시 토큰 구현
- Access Token: 1시간 만료
- Refresh Token: 30일 만료
- 자동 토큰 갱신 메커니즘

## ✅ 결론

**근본 원인**: 두 개의 서로 다른 JWT 시스템이 혼재되어 토큰 호환성 문제 발생

**해결 방법**: 전체 프로젝트에서 JWTManager로 통일하여 일관성 확보

**결과**: OAuth 로그인 후 프로필 API 정상 작동 ✅

---

**작성일**: 2025-11-24  
**작성자**: AI Development Assistant  
**버전**: 2.0 (Critical Bug Fix)
