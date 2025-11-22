# ✅ 관리자 계정 설정 완료

## 🎉 완료된 작업

### 1. 데이터베이스 업데이트 완료

**설정된 관리자 계정**:
```
1. wellthykorea@gmail.com (ID: 2) - role: admin ✅
2. wellthy47@gmail.com (ID: 4) - role: admin ✅  
3. wellthy47@naver.com (ID: 39) - role: admin ✅
```

**SQL 실행**:
```sql
UPDATE users 
SET role = 'admin' 
WHERE email LIKE '%wellthy%';

-- 3 rows updated ✅
```

---

## 🔑 관리자 로그인 방법

### ⚠️ 중요: 반드시 다시 로그인하세요!

현재 브라우저의 localStorage에는 **이전 사용자 정보**가 저장되어 있습니다.
데이터베이스에서 role을 변경했지만, **다시 로그인해야 새로운 권한이 적용**됩니다.

### 단계별 로그인

#### 1. 로그아웃
```
https://www.aromapulse.kr
→ 상단 로그아웃 버튼 클릭
```

#### 2. 다시 로그인
```
https://www.aromapulse.kr/login

이메일: wellthykorea@gmail.com (또는 다른 wellthy 계정)
비밀번호: (본인 비밀번호)
```

#### 3. 관리자 권한 확인 (F12 콘솔)
```javascript
const user = JSON.parse(localStorage.getItem('user'));
console.log('role:', user.role);  // "admin" 이어야 함
```

**예상 출력**:
```json
{
  "id": 2,
  "email": "wellthykorea@gmail.com",
  "name": "정하민",
  "user_type": "B2C",
  "role": "admin"  // ✅ 이것이 중요!
}
```

---

## 🧪 관리자 권한 테스트

### 1. 워크샵 페이지 접속
```
https://www.aromapulse.kr/workshops
→ ✅ 워크샵 목록이 표시되어야 함
```

### 2. 워크샵 상세 페이지
```
https://www.aromapulse.kr/workshop/201
→ ✅ 상세 페이지 접속 가능
→ ✅ 견적 문의 폼 작성 가능
```

### 3. 권한 체크 확인 (F12 콘솔)
```javascript
// checkQuotePermission 함수 테스트
const permission = checkQuotePermission();
console.log(permission);
```

**관리자 예상 출력**:
```json
{
  "hasPermission": true,
  "isAdmin": true
}
```

**일반 사용자 예상 출력**:
```json
{
  "hasPermission": false,
  "reason": "not_b2b"
}
```

---

## 🔍 문제 해결

### 문제: 여전히 워크샵 접속이 안 됩니다

**원인**: 로그아웃/로그인을 하지 않았거나, 브라우저 캐시 문제

**해결 방법**:

#### 1. 완전 로그아웃 후 재로그인
```javascript
// F12 콘솔에서 실행
localStorage.clear();
sessionStorage.clear();
window.location.href = '/login';
```

#### 2. 브라우저 캐시 강제 새로고침
- **Windows**: Ctrl + Shift + R
- **Mac**: Cmd + Shift + R

#### 3. 시크릿/프라이빗 모드에서 테스트
```
새 시크릿 창 열기
→ https://www.aromapulse.kr/login
→ 관리자 계정으로 로그인
→ 워크샵 페이지 접속 테스트
```

#### 4. 수동으로 localStorage 확인
```javascript
// F12 콘솔에서
const user = JSON.parse(localStorage.getItem('user'));
console.log('현재 role:', user.role);

// role이 'user'로 나온다면 → 다시 로그인 필요
// role이 'admin'으로 나온다면 → 이미 관리자 ✅
```

---

## 📊 관리자 vs 일반 사용자

| 구분 | role | user_type | 워크샵 접속 | 견적 문의 |
|------|------|-----------|------------|-----------|
| **wellthykorea@gmail.com** | admin | B2C | ✅ | ✅ |
| **wellthy47@gmail.com** | admin | B2B | ✅ | ✅ |
| **wellthy47@naver.com** | admin | B2C | ✅ | ✅ |
| 일반 B2C 사용자 | user | B2C | ✅ (목록만) | ❌ |
| 일반 B2B 사용자 | user | B2B | ✅ | 조건 충족 시 |

---

## 🎯 주의사항

### 1. is_admin 컬럼은 없습니다

프로덕션 데이터베이스에는 `is_admin` 컬럼이 없습니다.
JavaScript 코드는 두 가지 조건을 체크합니다:

```javascript
// ✅ 이 조건으로 관리자 감지
if (user.role === 'admin') {
    return { hasPermission: true, isAdmin: true };
}

// ❌ 이 조건은 작동 안 함 (컬럼 없음)
if (user.is_admin === 1) {
    // ...
}
```

**결론**: `role === 'admin'` 조건만 사용됩니다.

### 2. 로그인 시 role 포함 여부 확인

백엔드 로그인 API가 `role` 필드를 응답에 포함하는지 확인이 필요합니다.
만약 포함하지 않는다면, 백엔드 코드도 수정해야 합니다.

---

## 🚀 다음 단계

### 1. 즉시 실행
```
1. 로그아웃
2. 다시 로그인
3. 워크샵 페이지 접속 테스트
```

### 2. 여전히 안 되면
**백엔드 로그인 API 확인 필요**

로그인 응답에 `role` 필드가 포함되는지 확인:
```javascript
// 로그인 후 F12 콘솔에서
const user = JSON.parse(localStorage.getItem('user'));
console.log('전체 사용자 정보:', user);

// role 필드가 있나요?
console.log('role:', user.role);
```

만약 `role: undefined`가 나온다면:
- 백엔드 `/api/auth/login` 엔드포인트 수정 필요
- 응답에 `role` 필드 추가 필요

---

## ✅ 확인 체크리스트

- [ ] 로그아웃 완료
- [ ] 다시 로그인 완료
- [ ] localStorage에서 `role: "admin"` 확인
- [ ] 워크샵 목록 페이지 접속 가능
- [ ] 워크샵 상세 페이지 접속 가능
- [ ] 견적 문의 폼 작성 가능
- [ ] `checkQuotePermission()` 결과가 `{ hasPermission: true, isAdmin: true }`

---

**모든 wellthy 계정이 관리자로 설정되었습니다! 로그아웃 후 다시 로그인하시면 워크샵 페이지에 접속하실 수 있습니다!** 🎉
