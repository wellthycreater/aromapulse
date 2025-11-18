# 잘못 등록된 워크샵 삭제

## Cloudflare Dashboard에서 실행
**위치**: https://dash.cloudflare.com/ > Workers & Pages > D1 > aromapulse-production > Console

## 1. 현재 워크샵 목록 확인
```sql
SELECT id, title, type FROM workshops ORDER BY id DESC LIMIT 10;
```

## 2. 잘못 등록된 워크샵 삭제 (예: ID 7번)
```sql
DELETE FROM workshops WHERE id = 7;
```

또는 제목으로 삭제:
```sql
DELETE FROM workshops WHERE title = '리더십 향기 테라피 워크샵';
```

## 3. 확인
```sql
SELECT id, title, type FROM workshops WHERE type = 'workshop' ORDER BY id;
```

---

**참고**: 삭제 후 관리자 페이지를 **Ctrl+Shift+R**로 새로고침하세요.
