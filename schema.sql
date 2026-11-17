-- Create inventory table
CREATE TABLE IF NOT EXISTS items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  sku TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  price REAL NOT NULL DEFAULT 0.0,
  image_key TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Sample initial items
INSERT OR IGNORE INTO items (id, name, sku, category, quantity, price, image_key) VALUES
('item-1', 'Wireless Ergonomic Mouse', 'SKU-LOGI-01', 'Electronics', 45, 29.99, NULL),
('item-2', 'Mechanical Keyboard RGB', 'SKU-KEY-02', 'Electronics', 20, 89.50, NULL),
('item-3', 'Ergonomic Desk Chair', 'SKU-FURN-03', 'Furniture', 12, 199.00, NULL),
('item-4', 'USB-C Fast Charging Cable 2M', 'SKU-CABL-04', 'Accessories', 150, 9.99, NULL);
