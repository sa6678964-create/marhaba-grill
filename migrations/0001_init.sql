// migrations/0001_init.sql
-- Initial schema for Marhaba ordering platform (Supabase/Postgres)

-- users (optional: integrate with Supabase Auth)
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE,
  full_name text,
  phone text,
  created_at timestamptz DEFAULT now()
);

-- admins
CREATE TABLE IF NOT EXISTS admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  display_name text,
  created_at timestamptz DEFAULT now()
);

-- menu items canonical source
CREATE TABLE IF NOT EXISTS menu_items (
  id text PRIMARY KEY,
  category_id text,
  name text NOT NULL,
  description text,
  price numeric(10,2) NOT NULL,
  is_popular boolean DEFAULT false,
  points integer DEFAULT 0,
  image text
);

-- orders
CREATE TABLE IF NOT EXISTS orders (
  id bigserial PRIMARY KEY,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  customer_name text,
  customer_email text,
  customer_phone text,
  address jsonb,
  subtotal numeric(10,2) NOT NULL DEFAULT 0,
  delivery_fee numeric(10,2) NOT NULL DEFAULT 0,
  discount numeric(10,2) NOT NULL DEFAULT 0,
  total numeric(10,2) NOT NULL DEFAULT 0,
  payment_method text,
  payment_status text,
  status text,
  external_payment_id text,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- order items
CREATE TABLE IF NOT EXISTS order_items (
  id bigserial PRIMARY KEY,
  order_id bigint REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id text,
  name text,
  unit_price numeric(10,2),
  quantity integer DEFAULT 1,
  options jsonb
);

-- payments_log
CREATE TABLE IF NOT EXISTS payments_log (
  id bigserial PRIMARY KEY,
  event_id text,
  external_id text,
  status text,
  raw jsonb,
  created_at timestamptz DEFAULT now()
);

-- webhook_logs
CREATE TABLE IF NOT EXISTS webhook_logs (
  id bigserial PRIMARY KEY,
  event_id text UNIQUE,
  type text,
  payload jsonb,
  created_at timestamptz DEFAULT now()
);

-- Simple indexes
CREATE INDEX IF NOT EXISTS idx_orders_external_payment_id ON orders (external_payment_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders (user_id);
