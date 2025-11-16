-- 라벤더 수면 룸 스프레이 제품 동기화 SQL
-- Step 1: 기본 제품 정보 삽입 (이미지 제외)

INSERT INTO products (
  name,
  description,
  category,
  price,
  stock_quantity,
  manufacturer,
  concept,
  scent_profile,
  usage_instructions,
  is_active,
  created_at,
  updated_at
) VALUES (
  '라벤더 수면 룸 스프레이',
  'ㅇㄹㄴㅇㄹㅇㄹㄴㅇㄹㄴㅇㄹㄴㅇ',
  'insomnia',
  1,
  100,
  '아로마펄스',
  'symptom_care',
  '라벤더, 캐모마일',
  '취침 30분 전 침실에 2-3회 분사',
  1,
  datetime('now'),
  datetime('now')
);

-- Step 2: 방금 삽입한 제품의 ID 확인 쿼리 (수동 실행 필요)
-- SELECT id FROM products WHERE name = '라벤더 수면 룸 스프레이' ORDER BY id DESC LIMIT 1;
