-- 20240220000012_create_updated_at_function.sql
-- Up Migration
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;   
END;        
$$ language 'plpgsql';

-- 20240220000001_create_enums.sql
-- Up Migration
CREATE TYPE user_role AS ENUM ('admin', 'staff', 'user');
CREATE TYPE payment_method_type AS ENUM ('cash', 'credit_card', 'debit_card', 'transfer');
CREATE TYPE transaction_status AS ENUM ('pending', 'completed', 'cancelled');
CREATE TYPE outlet_status AS ENUM ('active', 'inactive');
CREATE TYPE product_status AS ENUM ('active', 'inactive');


-- 20240220000002_create_accounts.sql
-- Up Migration
CREATE TABLE accounts (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    email text UNIQUE NOT NULL,
    password text NOT NULL
);



-- 20240220000003_create_users.sql
-- Up Migration
CREATE TABLE users (
    id_user bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    fullname varchar NOT NULL,
    email varchar UNIQUE NOT NULL,
    address text,
    phone varchar,
    photo_url varchar,
    role user_role DEFAULT 'staff',
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();



-- 20240220000004_create_outlets.sql
-- Up Migration
CREATE TABLE outlets (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name text NOT NULL,
    address text,
    status outlet_status DEFAULT 'active',
    open_at bigint,
    closed_at bigint,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    deleted_at timestamp with time zone
);

CREATE TRIGGER update_outlets_updated_at
    BEFORE UPDATE ON outlets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


-- 20240220000005_create_user_outlet.sql
-- Up Migration
CREATE TABLE user_outlet (
    user_id bigint REFERENCES users(id_user) ON DELETE CASCADE,
    outlet_id bigint REFERENCES outlets(id) ON DELETE CASCADE,
    UNIQUE(user_id, outlet_id)
);


-- 20240220000006_create_categories.sql
-- Up Migration
CREATE TABLE categories (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name text NOT NULL,
    picture text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    deleted_at timestamp with time zone
);

CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


-- 20240220000007_create_products.sql
-- Up Migration
CREATE TABLE products (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name text NOT NULL,
    price bigint NOT NULL,
    description text,
    picture text,
    status product_status DEFAULT 'active',
    category_id bigint REFERENCES categories(id) ON DELETE SET NULL,
    outlet_id bigint REFERENCES outlets(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    deleted_at timestamp with time zone
);

CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_outlet ON products(outlet_id);



-- 20240220000008_create_transactions.sql
-- Up Migration
CREATE TABLE transactions (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    invoice_number text NOT NULL UNIQUE,
    staff_id bigint REFERENCES users(id_user) ON DELETE SET NULL,
    name_consumer text,
    total_amount bigint NOT NULL,
    amount_paid bigint NOT NULL,
    change bigint NOT NULL,
    payment_method payment_method_type,
    provider text,
    status transaction_status DEFAULT 'pending',
    notes text,
    transaction_date timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TRIGGER update_transactions_updated_at
    BEFORE UPDATE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_transactions_staff ON transactions(staff_id);
CREATE INDEX idx_transactions_date ON transactions(transaction_date);


-- 20240220000009_create_detail_transaction.sql
-- Up Migration
CREATE TABLE detail_transactions (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    transaction_id bigint REFERENCES transactions(id) ON DELETE CASCADE,
    product_id bigint REFERENCES products(id) ON DELETE SET NULL,
    product_name text NOT NULL,
    product_price bigint NOT NULL,
    product_picture text,
    quantity int NOT NULL,
    subtotal bigint NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TRIGGER update_detail_transaction_updated_at
    BEFORE UPDATE ON detail_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_detail_transaction_transaction ON detail_transactions(transaction_id);


-- 20240220000010_create_carts.sql
-- Up Migration
CREATE TABLE carts (
    id SERIAL PRIMARY KEY, -- atau BIGSERIAL untuk int8
    product_id INT8 NOT NULL,
    staff_id INT8 NOT NULL,
    outlet_id INT8 NOT NULL, -- Tambahkan field outlet_id
    quantity INT4 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (outlet_id) REFERENCES outlets(id) -- Relasi ke tabel outlets
);

CREATE TRIGGER update_carts_updated_at
    BEFORE UPDATE ON carts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


-- 20240220000011_create_settings.sql
-- Up Migration
CREATE TABLE settings (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    outlet_id bigint REFERENCES outlets(id) ON DELETE CASCADE,
    ppn int DEFAULT 0,
    logo text,
    api_key text,
    UNIQUE(outlet_id)
);



-- create enum payment_method
CREATE TYPE payment_method_t AS ENUM (
  'cash',
  'credit_card',
  'debit_card',
  'e_wallet'
);
-- create function transaction
CREATE OR REPLACE FUNCTION create_transaction_with_payment(
  invoice_number text,
  staff_id bigint,
  name_customer text,
  total_amount bigint,
  amount_paid bigint,
  change bigint,
  payment_method payment_method_type,
  transaction_date timestamptz,
  carts jsonb,
  url_payment text DEFAULT NULL,
  provider text DEFAULT NULL
) RETURNS bigint -- Diubah ke RETURNS bigint
LANGUAGE plpgsql AS $$
DECLARE
  new_transaction_id bigint;
BEGIN
  -- Insert transaksi
  INSERT INTO transactions (
    invoice_number,
    staff_id,
    name_customer,
    total_amount,
    amount_paid,
    change,
    payment_method,
    transaction_date,
    status,
    url_payment,
    provider
  ) VALUES (
    invoice_number,
    staff_id,
    name_customer,
    total_amount,
    amount_paid,
    change,
    payment_method,
    transaction_date,
    CASE 
      WHEN payment_method = 'cash' THEN 'completed'::transaction_status
      ELSE 'pending'::transaction_status
    END,
    url_payment,
    provider
  ) RETURNING id INTO new_transaction_id;

  -- Insert detail transaksi
  INSERT INTO detail_transactions (
    transaction_id,
    product_id,
    product_name,
    product_price,
    quantity,
    product_picture,
    subtotal
  )
  SELECT
    new_transaction_id,
    (item->>'product_id')::bigint,
    item->>'product_name',
    (item->>'product_price')::bigint,
    (item->>'quantity')::integer,
    item->>'product_picture',
    (item->>'subtotal')::bigint
  FROM jsonb_array_elements(carts) AS item;

  -- Perbaikan DELETE: gunakan alias dan kualifikasi parameter
  DELETE FROM carts c
  WHERE c.staff_id = create_transaction_with_payment.staff_id;

  RETURN new_transaction_id; -- Langsung return nilai ID
EXCEPTION
  WHEN others THEN
    RAISE EXCEPTION 'Error creating transaction: %', SQLERRM;
END;
$$;

-- create table logs
create table
  logs (
    id uuid not null default uuid_generate_v4() primary key,
    created_at timestamp with time zone not null default now(),
    level text not null check (level in ('error', 'warn', 'info', 'debug', 'verbose')),
    message text not null,
    context text null,
    error_stack text null,
    metadata jsonb null,
    user_id uuid null references auth.users (id),
    request_id text null
  );
