-- 샘플 제품 데이터 삽입
INSERT OR IGNORE INTO products (
  id, name, description, price, stock, category, concept,
  thumbnail_image, main_image, detail_image,
  is_active, created_at, updated_at
) VALUES 
(
  1, 
  '라벤더 릴렉스 디퓨저',
  '편안한 휴식을 위한 프리미엄 라벤더 디퓨저입니다. 자연스러운 향기로 마음의 안정을 찾아보세요.',
  45000,
  50,
  'insomnia',
  'symptom_care',
  'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400',
  'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=800',
  'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=1200',
  1,
  datetime('now'),
  datetime('now')
),
(
  2,
  '유칼립투스 프레시 에센셜 오일',
  '상쾌한 아침을 위한 유칼립투스 에센셜 오일. 기분 전환과 집중력 향상에 도움을 줍니다.',
  38000,
  30,
  'stress',
  'refresh',
  'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400',
  'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=800',
  'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=1200',
  1,
  datetime('now'),
  datetime('now')
),
(
  3,
  '힐링 아로마 세트',
  '불안과 스트레스 해소를 위한 아로마 세트. 라벤더, 카모마일, 베르가못이 포함되어 있습니다.',
  89000,
  20,
  'anxiety',
  'symptom_care',
  'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400',
  'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=800',
  'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=1200',
  1,
  datetime('now'),
  datetime('now')
);
