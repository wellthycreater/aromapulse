# 🖥️ 로컬 샌드박스 작업 가이드

## 현재 상황
- **로컬 샌드박스**: https://3000-ixw6l6ek5pa4nw2e7gi09-c07dda5e.sandbox.novita.ai
- **관리자 페이지**: https://3000-xxx.sandbox.novita.ai/static/admin-products
- **로컬 DB 사용** → 사용자 페이지와 동기화 안 됨 ❌

---

## ✅ 로컬 샌드박스 작업 워크플로우

### 1️⃣ 로컬 관리자 페이지에서 제품 등록/수정/삭제
```
https://3000-ixw6l6ek5pa4nw2e7gi09-c07dda5e.sandbox.novita.ai/static/admin-login
```

1. 로그인
2. 제품 관리 페이지에서 제품 등록/수정/삭제
3. 로컬 DB에만 반영됨 (아직 프로덕션 반영 안 됨)

---

### 2️⃣ 프로덕션 DB로 동기화

**방법 A: 자동 SQL 생성 (추천)**

```bash
cd /home/user/webapp
./sync-to-production.sh
```

실행하면:
- ✅ 로컬 DB의 모든 제품을 조회
- ✅ 프로덕션 DB 동기화 SQL 자동 생성
- ✅ `SYNC-TO-PRODUCTION.sql` 파일 생성

**방법 B: 수동 동기화**

Cloudflare D1 Console에서 수동으로 INSERT 실행

---

### 3️⃣ Cloudflare D1 Console에서 SQL 실행

1. **접속**: https://dash.cloudflare.com
2. **경로**: Workers & Pages → D1 → aromapulse-production → Console
3. **SQL 복사**: `/home/user/webapp/SYNC-TO-PRODUCTION.sql` 파일 내용 복사
4. **실행**: Console에 붙여넣고 Execute 클릭
5. **확인**: 
   ```sql
   SELECT id, name, price FROM products;
   ```

---

### 4️⃣ 사용자 페이지 확인

```
https://aromapulse.pages.dev/shop
```
새로고침하면 동기화된 제품이 보입니다! ✅

---

## 🔄 전체 워크플로우 요약

```
1. 로컬 관리자 페이지에서 작업
   ↓
2. ./sync-to-production.sh 실행
   ↓
3. SYNC-TO-PRODUCTION.sql 내용을 Cloudflare D1 Console에서 실행
   ↓
4. 사용자 페이지에서 확인
```

---

## 📝 자주 사용하는 명령어

### 로컬 제품 조회
```bash
cd /home/user/webapp
npx wrangler d1 execute aromapulse-production --local --command="SELECT id, name, price FROM products;"
```

### 로컬 제품 삭제 (초기화)
```bash
cd /home/user/webapp
npx wrangler d1 execute aromapulse-production --local --command="DELETE FROM products;"
```

### 테스트 제품 등록
```bash
cd /home/user/webapp
./insert-test-products.sh
```

### 프로덕션 동기화 SQL 생성
```bash
cd /home/user/webapp
./sync-to-production.sh
```

---

## ⚠️ 주의사항

1. **로컬 샌드박스는 임시 환경**
   - PM2로 서비스 재시작 시 로컬 DB 초기화될 수 있음
   - 중요한 제품은 반드시 프로덕션 DB에 동기화

2. **프로덕션 DB가 실제 데이터**
   - 사용자가 보는 것은 프로덕션 DB
   - 로컬은 테스트용

3. **매번 동기화 필요**
   - 로컬에서 작업 → 프로덕션 동기화 → 사용자 확인

---

## 🚀 더 편한 방법

프로덕션 관리자 페이지를 사용하면 자동 동기화됩니다:
```
https://bc470dba.aromapulse.pages.dev/admin-login
```

하지만 로컬 샌드박스에서 작업하고 싶으시면 위의 워크플로우를 따라주세요!
