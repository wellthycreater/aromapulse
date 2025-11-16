-- 프로덕션 DB에 라벤더 수면 롤온 제품 추가 (이미지 제외)
-- 이미지는 프로덕션 관리자 페이지에서 직접 업로드 필요

-- 기존 제품 삭제 (있을 경우)
DELETE FROM products WHERE name = '라벤더 수면 롤온';

-- 제품 메타데이터 추가
INSERT INTO products (
  name, description, category, price, concept, care_type,
  brand, volume, is_active, stock
) VALUES (
  '라벤더 수면 롤온',
  'ㄴㅇㄹㄴㅇㄹㅇㄴㄹㅇㄴ',
  'insomnia',
  35000,
  'symptom_care',
  'sleep',
  '아로마펄스',
  '10ml',
  1,
  100
);

-- 확인
SELECT id, name, price, concept, is_active FROM products WHERE name = '라벤더 수면 롤온';
