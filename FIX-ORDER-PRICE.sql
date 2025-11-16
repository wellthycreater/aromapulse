DELETE FROM products;

INSERT INTO products (name, description, category, price, stock, concept, is_active, created_at, updated_at) VALUES ('라벤더 수면 룸 스프레이', '편안한 수면을 위한 라벤더 룸 스프레이', 'insomnia', 1, 6, 'symptom_care', 1, datetime('now'), datetime('now'));

INSERT INTO products (name, description, category, price, stock, concept, is_active, created_at, updated_at) VALUES ('라벤더 수면 롤온', '편안한 수면을 위한 라벤더 롤온', 'insomnia', 35000, 6, 'symptom_care', 1, datetime('now'), datetime('now'));

SELECT id, name, price, stock, is_active FROM products ORDER BY id;
