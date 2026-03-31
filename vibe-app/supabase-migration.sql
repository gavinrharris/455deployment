-- ============================================
-- Supabase Migration: Schema Only
-- Run this in the Supabase SQL Editor
-- Then import data from seed-data/*.csv via
-- the Supabase Table Editor "Import data" button
-- Import order: customers, products, orders,
--   order_items, shipments, product_reviews
-- ============================================

-- Drop existing tables if re-running
DROP TABLE IF EXISTS order_predictions CASCADE;
DROP TABLE IF EXISTS product_reviews CASCADE;
DROP TABLE IF EXISTS shipments CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS customers CASCADE;

-- ============================================
-- 1. SCHEMA (no foreign keys — added after CSV import)
-- ============================================

CREATE TABLE customers (
  customer_id      serial PRIMARY KEY,
  full_name        text NOT NULL,
  email            text NOT NULL UNIQUE,
  gender           text NOT NULL,
  birthdate        text NOT NULL,
  created_at       text NOT NULL,
  city             text,
  state            text,
  zip_code         text,
  customer_segment text,
  loyalty_tier     text,
  is_active        integer NOT NULL DEFAULT 1
);

CREATE TABLE products (
  product_id   serial PRIMARY KEY,
  sku          text NOT NULL UNIQUE,
  product_name text NOT NULL,
  category     text NOT NULL,
  price        numeric NOT NULL,
  cost         numeric NOT NULL,
  is_active    integer NOT NULL DEFAULT 1
);

CREATE TABLE orders (
  order_id           serial PRIMARY KEY,
  customer_id        integer NOT NULL,
  order_datetime     text NOT NULL,
  billing_zip        text,
  shipping_zip       text,
  shipping_state     text,
  payment_method     text NOT NULL,
  device_type        text NOT NULL,
  ip_country         text NOT NULL,
  promo_used         integer NOT NULL DEFAULT 0,
  promo_code         text,
  order_subtotal     numeric NOT NULL,
  shipping_fee       numeric NOT NULL,
  tax_amount         numeric NOT NULL,
  order_total        numeric NOT NULL,
  risk_score         numeric NOT NULL,
  is_fraud           integer NOT NULL DEFAULT 0,
  fulfilled          integer NOT NULL DEFAULT 0
);

CREATE TABLE order_items (
  order_item_id  serial PRIMARY KEY,
  order_id       integer NOT NULL,
  product_id     integer NOT NULL,
  quantity       integer NOT NULL,
  unit_price     numeric NOT NULL,
  line_total     numeric NOT NULL
);

CREATE TABLE shipments (
  shipment_id        serial PRIMARY KEY,
  order_id           integer NOT NULL UNIQUE,
  ship_datetime      text NOT NULL,
  carrier            text NOT NULL,
  shipping_method    text NOT NULL,
  distance_band      text NOT NULL,
  promised_days      integer NOT NULL,
  actual_days        integer NOT NULL,
  late_delivery      integer NOT NULL DEFAULT 0
);

CREATE TABLE product_reviews (
  review_id       serial PRIMARY KEY,
  customer_id     integer NOT NULL,
  product_id      integer NOT NULL,
  rating          integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review_datetime text NOT NULL,
  review_text     text,
  UNIQUE(customer_id, product_id)
);

CREATE TABLE order_predictions (
  prediction_id              serial PRIMARY KEY,
  order_id                   integer,
  late_delivery_probability  numeric,
  predicted_late_delivery    integer,
  prediction_timestamp       timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_datetime ON orders(order_datetime);
CREATE INDEX idx_items_order ON order_items(order_id);
CREATE INDEX idx_items_product ON order_items(product_id);
CREATE INDEX idx_shipments_late ON shipments(late_delivery);
CREATE INDEX idx_reviews_product ON product_reviews(product_id);
CREATE INDEX idx_reviews_customer ON product_reviews(customer_id);

-- ============================================
-- 2. RPC FUNCTIONS
-- ============================================

DROP FUNCTION IF EXISTS get_schema_info();
DROP FUNCTION IF EXISTS get_priority_queue();

CREATE OR REPLACE FUNCTION get_schema_info()
RETURNS TABLE(table_name text, column_name text, data_type text, is_nullable text)
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT table_name::text, column_name::text, data_type::text, is_nullable::text
  FROM information_schema.columns
  WHERE table_schema = 'public'
  ORDER BY table_name, ordinal_position;
$$;

CREATE OR REPLACE FUNCTION get_priority_queue()
RETURNS TABLE(
  order_id integer,
  order_datetime text,
  order_total numeric,
  fulfilled integer,
  customer_id integer,
  customer_name text,
  late_delivery_probability numeric,
  predicted_late_delivery integer,
  prediction_timestamp timestamptz
)
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT
    o.order_id,
    o.order_datetime,
    o.order_total,
    o.fulfilled,
    c.customer_id,
    c.full_name AS customer_name,
    p.late_delivery_probability,
    p.predicted_late_delivery,
    p.prediction_timestamp
  FROM orders o
  JOIN customers c ON c.customer_id = o.customer_id
  JOIN order_predictions p ON p.order_id = o.order_id
  WHERE o.fulfilled = 0
  ORDER BY p.late_delivery_probability DESC, o.order_datetime ASC
  LIMIT 50;
$$;

-- ============================================
-- 3. DATA
-- ============================================
-- Import CSV files from seed-data/ folder in this order:
--   1. customers.csv    (250 rows)
--   2. products.csv     (100 rows)
--   3. orders.csv       (5,000 rows)
--   4. order_items.csv  (15,022 rows)
--   5. shipments.csv    (5,000 rows)
--   6. product_reviews.csv (3,000 rows)
--
-- In Supabase: Table Editor → select table → Import data → upload CSV
-- ============================================

-- ============================================
-- 4. AFTER CSV IMPORT — run this to add foreign
--    keys and reset sequences
-- ============================================

-- Foreign keys
ALTER TABLE orders
  ADD CONSTRAINT orders_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES customers(customer_id);

ALTER TABLE order_items
  ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES orders(order_id);
ALTER TABLE order_items
  ADD CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(product_id);

ALTER TABLE shipments
  ADD CONSTRAINT shipments_order_id_fkey FOREIGN KEY (order_id) REFERENCES orders(order_id);

ALTER TABLE product_reviews
  ADD CONSTRAINT product_reviews_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES customers(customer_id);
ALTER TABLE product_reviews
  ADD CONSTRAINT product_reviews_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(product_id);

ALTER TABLE order_predictions
  ADD CONSTRAINT order_predictions_order_id_fkey FOREIGN KEY (order_id) REFERENCES orders(order_id);

-- Reset sequences
SELECT setval('customers_customer_id_seq', (SELECT MAX(customer_id) FROM customers));
SELECT setval('products_product_id_seq', (SELECT MAX(product_id) FROM products));
SELECT setval('orders_order_id_seq', (SELECT MAX(order_id) FROM orders));
SELECT setval('order_items_order_item_id_seq', (SELECT MAX(order_item_id) FROM order_items));
SELECT setval('shipments_shipment_id_seq', (SELECT MAX(shipment_id) FROM shipments));
SELECT setval('product_reviews_review_id_seq', (SELECT MAX(review_id) FROM product_reviews));
SELECT setval('order_predictions_prediction_id_seq', 1, false);
