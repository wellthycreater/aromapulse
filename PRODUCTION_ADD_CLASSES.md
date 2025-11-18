# 프로덕션에 원데이 클래스 추가하기

## Cloudflare Dashboard에서 실행
**위치**: https://dash.cloudflare.com/ > Workers & Pages > D1 > aromapulse-production > Console

## 1단계: 천연 디퓨저 만들기 추가

```sql
INSERT INTO workshops (provider_id, title, description, category, location, address, price, duration, max_participants, image_url, is_active, type, created_at, updated_at)
VALUES (1, '천연 디퓨저 만들기', '100% 천연 에센셜 오일로 만드는 나만의 디퓨저 클래스입니다. 집안을 은은한 향기로 채워보세요.', '디퓨저 만들기', '경기', '분당구 정자동 456', 55000, 90, 8, null, 1, 'class', datetime('now'), datetime('now'));
```

## 2단계: 나만의 향수 만들기 추가

```sql
INSERT INTO workshops (provider_id, title, description, category, location, address, price, duration, max_participants, image_url, is_active, type, created_at, updated_at)
VALUES (1, '나만의 향수 만들기', '조향사가 직접 알려주는 향수 만들기 클래스. 나만의 시그니처 향을 만들어보세요.', '향수 만들기', '서울', '강남구 청담동 789', 85000, 150, 6, null, 1, 'class', datetime('now'), datetime('now'));
```

## 3단계: 확인

```sql
SELECT id, title, type, price FROM workshops WHERE type = 'class' ORDER BY id;
```

결과:
- 천연 디퓨저 만들기 - type: class - 55,000원
- 나만의 향수 만들기 - type: class - 85,000원

## 4단계: 웹사이트에서 확인
- 관리자 페이지: https://www.aromapulse.kr/static/admin-products
- 원데이 클래스 탭에서 2개 클래스 확인
- 원데이 클래스 페이지: https://www.aromapulse.kr/static/classes

---

**참고**: provider_id=1은 "프로덕션 테스트" 제공자입니다.
