-- Create product_bookings table
CREATE TABLE IF NOT EXISTS product_bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  user_id INTEGER,
  booking_date DATETIME NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  total_price INTEGER NOT NULL,
  booker_name TEXT NOT NULL,
  booker_phone TEXT NOT NULL,
  booker_email TEXT NOT NULL,
  special_requests TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_product_bookings_product_id ON product_bookings(product_id);
CREATE INDEX IF NOT EXISTS idx_product_bookings_user_id ON product_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_product_bookings_booking_date ON product_bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_product_bookings_status ON product_bookings(status);
