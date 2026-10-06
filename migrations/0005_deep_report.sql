ALTER TABLE orders ADD COLUMN edition TEXT NOT NULL DEFAULT 'basic' CHECK (edition IN ('basic','plus','deep'));
UPDATE orders SET edition = plan;
ALTER TABLE orders DROP COLUMN plan;
ALTER TABLE orders RENAME COLUMN edition TO plan;
ALTER TABLE orders ADD COLUMN dependency_order_id TEXT REFERENCES orders(id);
DROP INDEX orders_active_upgrade;
CREATE UNIQUE INDEX orders_pending_upgrade ON orders(parent_order_id) WHERE parent_order_id IS NOT NULL AND status = 'pending';
