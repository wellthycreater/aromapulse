# 원데이 클래스 이미지 추가하기

## Cloudflare Dashboard에서 실행
**위치**: https://dash.cloudflare.com/ > Workers & Pages > D1 > aromapulse-production > Console

## 옵션 1: 아로마 테라피 관련 무료 이미지 (Unsplash)

### 천연 디퓨저 만들기 이미지 추가
```sql
UPDATE workshops SET image_url = 'https://images.unsplash.com/photo-1602874801006-47c4f7702cf4?w=800' WHERE id = 14;
```

### 나만의 향수 만들기 이미지 추가
```sql
UPDATE workshops SET image_url = 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=800' WHERE id = 15;
```

---

## 옵션 2: 관리자 페이지에서 직접 업로드

1. **관리자 페이지** 접속: https://www.aromapulse.kr/static/admin-products
2. **원데이 클래스** 탭 클릭
3. 각 클래스의 **수정** 버튼 클릭
4. **이미지 업로드** 섹션에서 파일 선택
5. **업로드** 버튼 클릭 (자동 압축 500KB 이하)
6. **저장** 버튼 클릭

---

## 추천 무료 이미지 사이트
- **Unsplash**: https://unsplash.com/s/photos/aromatherapy
- **Pexels**: https://www.pexels.com/search/aromatherapy/
- **Pixabay**: https://pixabay.com/images/search/aromatherapy/

---

## 확인
```sql
SELECT id, title, image_url FROM workshops WHERE type = 'class' ORDER BY id;
```
