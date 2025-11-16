UPDATE products SET price = 1, updated_at = datetime('now') WHERE name = '라벤더 수면 룸 스프레이';

SELECT id, name, price, stock, is_active FROM products ORDER BY id;
