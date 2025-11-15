-- 주문 테이블 생성
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_number TEXT UNIQUE NOT NULL,
  user_id INTEGER,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_address TEXT,
  customer_detail_address TEXT,
  customer_zipcode TEXT,
  total_amount INTEGER NOT NULL,
  discount_amount INTEGER DEFAULT 0,
  delivery_fee INTEGER DEFAULT 0,
  final_amount INTEGER NOT NULL,
  payment_method TEXT DEFAULT 'payup',
  payment_status TEXT DEFAULT 'pending' CHECK(payment_status IN ('pending', 'paid', 'failed', 'cancelled', 'refunded')),
  order_status TEXT DEFAULT 'pending' CHECK(order_status IN ('pending', 'confirmed', 'preparing', 'shipped', 'delivered', 'cancelled')),
  payment_id TEXT,
  payment_data TEXT,
  delivery_company TEXT,
  tracking_number TEXT,
  delivery_message TEXT,
  admin_memo TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  paid_at DATETIME,
  shipped_at DATETIME,
  delivered_at DATETIME,
  cancelled_at DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 주문 상품 테이블 (주문 내역)
CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  product_name TEXT NOT NULL,
  product_concept TEXT NOT NULL,
  product_category TEXT,
  product_refresh_type TEXT,
  product_volume TEXT,
  quantity INTEGER NOT NULL,
  unit_price INTEGER NOT NULL,
  total_price INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_order_status ON orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
