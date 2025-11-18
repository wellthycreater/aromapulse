# 프로덕션 데이터베이스 마이그레이션 - 단계별 실행

Cloudflare Dashboard > D1 > aromapulse-production > Console에서 아래 SQL을 **하나씩** 실행하세요.

## 1단계: type 컬럼 추가
```sql
ALTER TABLE workshops ADD COLUMN type TEXT DEFAULT 'class';
```

## 2단계: 인덱스 생성
```sql
CREATE INDEX IF NOT EXISTS idx_workshops_type ON workshops(type);
```

## 3단계: 현재 데이터 확인
```sql
SELECT id, title, type, price FROM workshops ORDER BY id;
```

## 4단계: 천연 디퓨저를 class로 설정
```sql
UPDATE workshops SET type = 'class' WHERE title = '천연 디퓨저 만들기';
```

## 5단계: 향수 만들기를 class로 설정
```sql
UPDATE workshops SET type = 'class' WHERE title = '나만의 향수 만들기';
```

## 6단계: 잘못된 데이터 삭제 (ID 1)
```sql
DELETE FROM workshops WHERE id = 1;
```

## 7단계: 최종 확인
```sql
SELECT id, title, type, price FROM workshops ORDER BY type, id;
```

---

**중요**: 각 SQL 문을 개별적으로 실행하고, 에러가 없는지 확인하세요.
