# OAuth Provider-Based Content Filtering

## 📋 개요

카카오, 구글, 네이버 로그인을 통해 접근하는 사용자들에게 서로 다른 제품 및 원데이 클래스를 보여주는 해시 기반 필터링 시스템을 구현했습니다.

## 🎯 구현 목표

**핵심 요구사항**: 카카오/구글/네이버 로그인을 통해 보여지는 지도 기반 제품 또는 원데이 클래스의 항목이 3가지 간에 절대 겹치지 않도록 보장

## 🔧 기술적 구현

### 1. 해시 기반 자동 분배 방식

```typescript
// OAuth 제공자별 인덱스 매핑
const providerIndex = {
  'kakao': 0,  // ID % 3 === 0
  'google': 1, // ID % 3 === 1
  'naver': 2   // ID % 3 === 2
};

// 필터링 로직
return items.filter(item => {
  const id = typeof item.id === 'string' ? parseInt(item.id, 10) : item.id;
  return id % 3 === targetIndex;
});
```

### 2. 구현 파일

#### `/src/utils/oauth-filter.ts`
- `filterByOAuthProvider()`: 항목 배열을 OAuth 제공자별로 필터링
- `shouldShowToProvider()`: 특정 항목이 제공자에게 표시되는지 확인
- `calculateProviderDistribution()`: 제공자별 항목 개수 계산

#### `/src/routes/products.ts`
```typescript
import { filterByOAuthProvider, type OAuthProvider } from '../utils/oauth-filter';

// GET /api/products?provider=kakao
const provider = c.req.query('provider') as OAuthProvider | undefined;
productsList = filterByOAuthProvider(productsList, provider);
```

#### `/src/routes/oneday-classes.ts`
```typescript
import { filterByOAuthProvider, type OAuthProvider } from '../utils/oauth-filter';

// GET /api/oneday-classes?provider=google
const provider = c.req.query('provider') as OAuthProvider | undefined;
const filteredResults = filterByOAuthProvider(result.results, provider);
```

## ✅ 테스트 결과

### 로컬 테스트 (9개 제품)

```bash
# 전체 제품 (provider 없음)
Total: 9 products

# Kakao (ID % 3 = 0)
ID: 3, 6, 9

# Google (ID % 3 = 1)
ID: 1, 4, 7

# Naver (ID % 3 = 2)
ID: 2, 5, 8
```

### 프로덕션 테스트

**제품 (Products)**
```json
// Kakao
[
  {"id": 30, "name": "ELENA Fabric Perfume"},
  {"id": 3, "name": "힐링 아로마 세트"}
]

// Google
[
  {"id": 28, "name": "라벤더 수면 룸 스프레이"},
  {"id": 1, "name": "라벤더 릴렉스 디퓨저"}
]

// Naver
[
  {"id": 29, "name": "라벤더 수면 롤온"},
  {"id": 2, "name": "유칼립투스 프레시 에센셜 오일"}
]
```

**원데이 클래스 (Oneday Classes)**
```json
// Kakao
[
  {"id": 18, "title": "프리미엄 향수 조향 클래스"},
  {"id": 15, "title": "향기로운 힐링 체험"}
]

// Google
[
  {"id": 103, "title": "향수공방 캔들공방 천연비누공방 로이베어"},
  {"id": 16, "title": "천연 디퓨저 만들기"}
]

// Naver
[
  {"id": 17, "title": "캔들 & 왁스타블렛 클래스"},
  {"id": 101, "title": "힐링 아로마 원데이 클래스"}
]
```

## 🎨 프론트엔드 통합

### healing.html (지도 화면)

```javascript
// Line 1116: API 호출 시 provider 파라미터 전달
const response = await fetch(`/api/oneday-classes?provider=${currentUser.provider}`);
```

현재 사용자의 OAuth 제공자(kakao/google/naver)가 자동으로 API 요청에 포함됩니다.

## 📊 장점

1. **DB 스키마 변경 불필요**: 기존 테이블 구조 유지
2. **자동 균등 분배**: 새 항목 추가 시 자동으로 3개 그룹에 분배
3. **간단한 로직**: 모듈로 연산(%)만으로 구현
4. **확장 가능**: 제공자 추가 시 쉽게 조정 가능
5. **예측 가능**: ID를 알면 어느 제공자에게 표시될지 명확

## 🔍 로그 출력

서버 로그에서 필터링 결과를 확인할 수 있습니다:

```
[OAuth Filter - Products] Provider: kakao, Total: 9, Filtered: 3
[OAuth Filter - Products] Provider: google, Total: 9, Filtered: 3
[OAuth Filter - Products] Provider: naver, Total: 9, Filtered: 3
[OAuth Filter] Provider: kakao, Total: 4, Filtered: 2
```

## 🚀 배포 정보

- **Production URL**: https://46eeea68.aromapulse.pages.dev
- **GitHub Commit**: 6c450ae
- **Deployment Date**: 2025-11-24
- **Status**: ✅ Live and Tested

## 📝 API 엔드포인트

### 제품 목록
```
GET /api/products?provider={kakao|google|naver}
```

### 원데이 클래스 목록
```
GET /api/oneday-classes?provider={kakao|google|naver}
```

**참고**: `provider` 파라미터가 없으면 모든 항목이 반환됩니다 (로그인하지 않은 사용자 대응).

## 🎯 결론

✅ **완료**: 카카오, 구글, 네이버 로그인 사용자는 이제 완전히 다른 제품 및 클래스를 지도에서 볼 수 있습니다.
✅ **검증**: 로컬 및 프로덕션 환경에서 모두 테스트 완료
✅ **유지보수**: 간단한 로직으로 장기 유지보수 용이

---

**작성일**: 2025-11-24  
**작성자**: AI Development Assistant  
**버전**: 1.0
