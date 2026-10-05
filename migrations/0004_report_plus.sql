ALTER TABLE orders ADD COLUMN plan TEXT NOT NULL DEFAULT 'basic' CHECK (plan IN ('basic','plus'));
ALTER TABLE orders ADD COLUMN parent_order_id TEXT REFERENCES orders(id);
ALTER TABLE orders ADD COLUMN expected_amount INTEGER NOT NULL DEFAULT 499;
ALTER TABLE orders ADD COLUMN delivery_base_url TEXT NOT NULL DEFAULT 'https://12axes.net';
CREATE UNIQUE INDEX orders_active_upgrade ON orders(parent_order_id) WHERE parent_order_id IS NOT NULL AND status IN ('pending','paid');
