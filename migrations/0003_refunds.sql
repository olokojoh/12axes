CREATE TABLE refunded_payments (
  payment_intent_id TEXT PRIMARY KEY,
  amount_refunded INTEGER NOT NULL,
  full_refund INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
