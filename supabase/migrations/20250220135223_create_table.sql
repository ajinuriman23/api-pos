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
CREATE TABLE detail_transaction (
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
    BEFORE UPDATE ON detail_transaction
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_detail_transaction_transaction ON detail_transaction(transaction_id);


-- 20240220000010_create_carts.sql
-- Up Migration
CREATE TABLE carts (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    product_id bigint REFERENCES products(id) ON DELETE CASCADE,
    staff_id bigint REFERENCES users(id_user) ON DELETE CASCADE,
    quantity int NOT NULL DEFAULT 1,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
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


-- 20240220000013_enable_rls.sql
-- Up Migration
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE detail_transaction ENABLE ROW LEVEL SECURITY;
