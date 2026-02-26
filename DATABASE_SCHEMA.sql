-- =====================================================
-- John Kivenge Liquor Stock Platform - Database Schema
-- PostgreSQL 15+ with Row Level Security (RLS)
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =====================================================
-- ENUM TYPES
-- =====================================================

-- User roles
CREATE TYPE user_role AS ENUM ('customer', 'staff', 'admin');

-- Order status
CREATE TYPE order_status AS ENUM (
    'pending', 'processing', 'packed', 'ready_for_pickup', 
    'in_transit', 'delivered', 'completed', 'cancelled'
);

-- Payment status
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');

-- Payment methods
CREATE TYPE payment_method AS ENUM ('mtn', 'airtel', 'stripe');

-- Product status
CREATE TYPE product_status AS ENUM ('active', 'discontinued', 'draft');

-- Conversation status
CREATE TYPE conversation_status AS ENUM ('active', 'resolved', 'archived');

-- =====================================================
-- CORE TABLES
-- =====================================================

-- Categories (hierarchical)
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    image_url VARCHAR(500),
    parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Suppliers
CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sku VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    brand VARCHAR(100) NOT NULL,
    category_id UUID REFERENCES categories(id),
    subcategory_id UUID REFERENCES categories(id),
    supplier_id UUID REFERENCES suppliers(id),
    description TEXT,
    price_cents INTEGER NOT NULL,
    discount_percent SMALLINT DEFAULT 0,
    alcohol_percent DECIMAL(4,2),
    volume_ml INTEGER,
    stock_quantity INTEGER DEFAULT 0,
    reserved_quantity INTEGER DEFAULT 0,
    reorder_level INTEGER DEFAULT 10,
    status product_status DEFAULT 'draft',
    image_urls JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}', -- Tasting notes, origin, etc.
    search_vector tsvector,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_stock CHECK (stock_quantity >= reserved_quantity),
    CONSTRAINT valid_price CHECK (price_cents > 0),
    CONSTRAINT valid_discount CHECK (discount_percent >= 0 AND discount_percent <= 100)
);

-- Product images (separate table for better management)
CREATE TABLE product_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    url VARCHAR(500) NOT NULL,
    alt_text VARCHAR(255),
    sort_order INTEGER DEFAULT 0,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- USER MANAGEMENT TABLES
-- =====================================================

-- User profiles (extends Supabase auth.users)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    avatar_url VARCHAR(500),
    role user_role DEFAULT 'customer',
    is_active BOOLEAN DEFAULT true,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Addresses
CREATE TABLE addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('shipping', 'billing')),
    is_default BOOLEAN DEFAULT false,
    street_address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'Rwanda',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ORDER MANAGEMENT TABLES
-- =====================================================

-- Orders
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id UUID NOT NULL REFERENCES profiles(id),
    status order_status DEFAULT 'pending',
    total_amount_cents INTEGER NOT NULL,
    tax_cents INTEGER DEFAULT 0,
    discount_cents INTEGER DEFAULT 0,
    shipping_cost_cents INTEGER DEFAULT 0,
    payment_method payment_method,
    payment_status payment_status DEFAULT 'pending',
    payment_reference VARCHAR(255),
    shipping_address JSONB NOT NULL,
    billing_address JSONB,
    customer_notes TEXT,
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT positive_total CHECK (total_amount_cents > 0),
    CONSTRAINT valid_tax CHECK (tax_cents >= 0),
    CONSTRAINT valid_discount CHECK (discount_cents >= 0)
);

-- Order items
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL,
    unit_price_cents INTEGER NOT NULL,
    discount_cents INTEGER DEFAULT 0,
    total_cents INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_quantity CHECK (quantity > 0),
    CONSTRAINT valid_unit_price CHECK (unit_price_cents > 0),
    CONSTRAINT valid_total_cents CHECK (total_cents >= 0)
);

-- Order status history
CREATE TABLE order_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    from_status order_status,
    to_status order_status NOT NULL,
    notes TEXT,
    changed_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- PAYMENT TABLES
-- =====================================================

-- Payment transactions
CREATE TABLE payment_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id),
    gateway VARCHAR(50) NOT NULL, -- 'stripe', 'mtn', 'airtel'
    gateway_transaction_id VARCHAR(255),
    amount_cents INTEGER NOT NULL,
    currency VARCHAR(3) DEFAULT 'RWF',
    status payment_status DEFAULT 'pending',
    gateway_response JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT positive_amount CHECK (amount_cents > 0)
);

-- =====================================================
-- REVIEW AND RATING SYSTEM
-- =====================================================

-- Product reviews
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(255),
    content TEXT,
    is_verified BOOLEAN DEFAULT false, -- Verified purchase
    is_approved BOOLEAN DEFAULT false,
    helpful_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(product_id, customer_id, order_id)
);

-- Review helpful votes
CREATE TABLE review_helpful_votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    is_helpful BOOLEAN NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(review_id, user_id)
);

-- =====================================================
-- CHAT AND MESSAGING SYSTEM
-- =====================================================

-- Conversations
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    admin_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    status conversation_status DEFAULT 'active',
    subject VARCHAR(255),
    last_message_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    attachment_urls JSONB DEFAULT '[]',
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- =====================================================
-- INVENTORY MANAGEMENT
-- =====================================================

-- Stock movements
CREATE TABLE stock_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    movement_type VARCHAR(20) NOT NULL CHECK (movement_type IN ('in', 'out', 'adjustment')),
    quantity INTEGER NOT NULL,
    reference_type VARCHAR(50), -- 'order', 'purchase', 'adjustment'
    reference_id UUID,
    reason TEXT,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT non_zero_quantity CHECK (quantity != 0)
);

-- =====================================================
-- SYSTEM AND AUDIT TABLES
-- =====================================================

-- Audit log
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name VARCHAR(100) NOT NULL,
    record_id UUID,
    action VARCHAR(20) NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    old_values JSONB,
    new_values JSONB,
    user_id UUID REFERENCES profiles(id),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System settings
CREATE TABLE system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Products indexes
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_status ON products(status) WHERE status = 'active';
CREATE INDEX idx_products_search ON products USING GIN(search_vector);
CREATE INDEX idx_products_brand ON products(brand);
CREATE INDEX idx_products_price ON products(price_cents);
CREATE INDEX idx_products_stock ON products(stock_quantity) WHERE stock_quantity > 0;

-- Orders indexes
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at DESC);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);

-- Order items indexes
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);

-- Reviews indexes
CREATE INDEX idx_reviews_product ON reviews(product_id);
CREATE INDEX idx_reviews_customer ON reviews(customer_id);
CREATE INDEX idx_reviews_approved ON reviews(is_approved) WHERE is_approved = true;

-- Conversations indexes
CREATE INDEX idx_conversations_customer ON conversations(customer_id);
CREATE INDEX idx_conversations_admin ON conversations(admin_id);
CREATE INDEX idx_conversations_status ON conversations(status);

-- Messages indexes
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_created ON messages(created_at DESC);

-- Stock movements indexes
CREATE INDEX idx_stock_movements_product ON stock_movements(product_id);
CREATE INDEX idx_stock_movements_created ON stock_movements(created_at DESC);

-- =====================================================
-- TRIGGERS AND FUNCTIONS
-- =====================================================

-- Update search vector for products
CREATE OR REPLACE FUNCTION update_product_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := 
        setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.brand, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'C') ||
        setweight(to_tsvector('english', COALESCE(NEW.sku, '')), 'D');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_product_search_vector
    BEFORE INSERT OR UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_product_search_vector();

-- Update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER trigger_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_conversations_updated_at BEFORE UPDATE ON conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_messages_updated_at BEFORE UPDATE ON messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Generate order numbers
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.order_number := 'JK-' || TO_CHAR(NOW(), 'YYYY') || '-' || 
                        LPAD(EXTRACT(MONTH FROM NOW())::TEXT, 2, '0') || '-' ||
                        LPAD(EXTRACT(DAY FROM NOW())::TEXT, 2, '0') || '-' ||
                        LPAD(NEXTVAL('order_number_seq')::TEXT, 4, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE order_number_seq START 1;

CREATE TRIGGER trigger_generate_order_number
    BEFORE INSERT ON orders
    FOR EACH ROW EXECUTE FUNCTION generate_order_number();

-- Audit logging function
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        INSERT INTO audit_logs (table_name, record_id, action, old_values, user_id)
        VALUES (TG_TABLE_NAME, OLD.id, TG_OP, row_to_json(OLD), auth.uid());
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_logs (table_name, record_id, action, old_values, new_values, user_id)
        VALUES (TG_TABLE_NAME, NEW.id, TG_OP, row_to_json(OLD), row_to_json(NEW), auth.uid());
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO audit_logs (table_name, record_id, action, new_values, user_id)
        VALUES (TG_TABLE_NAME, NEW.id, TG_OP, row_to_json(NEW), auth.uid());
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_helpful_votes ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "users_view_own_profile" ON profiles
    FOR SELECT USING (id = auth.uid() OR 
                      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "users_update_own_profile" ON profiles
    FOR UPDATE USING (id = auth.uid());

-- Addresses policies
CREATE POLICY "users_manage_own_addresses" ON addresses
    FOR ALL USING (user_id = auth.uid());

-- Orders policies
CREATE POLICY "users_view_own_orders" ON orders
    FOR SELECT USING (customer_id = auth.uid() OR 
                      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff')));

CREATE POLICY "users_create_own_orders" ON orders
    FOR INSERT WITH CHECK (customer_id = auth.uid());

-- Order items policies
CREATE POLICY "users_view_own_order_items" ON order_items
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM orders WHERE id = order_items.order_id 
        AND (customer_id = auth.uid() OR 
             EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff')))
    ));

-- Conversations policies
CREATE POLICY "conversation_participants" ON conversations
    FOR SELECT USING (
        customer_id = auth.uid() OR 
        admin_id = auth.uid() OR 
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "customers_create_conversations" ON conversations
    FOR INSERT WITH CHECK (customer_id = auth.uid());

-- Messages policies
CREATE POLICY "conversation_participants_messages" ON messages
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM conversations WHERE id = messages.conversation_id
        AND (customer_id = auth.uid() OR admin_id = auth.uid() OR
             EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
    ));

CREATE POLICY "conversation_participants_send_messages" ON messages
    FOR INSERT WITH CHECK (EXISTS (
        SELECT 1 FROM conversations WHERE id = conversations_id
        AND (customer_id = auth.uid() OR admin_id = auth.uid())
    ));

-- Reviews policies
CREATE POLICY "users_view_approved_reviews" ON reviews
    FOR SELECT USING (is_approved = true OR 
                      customer_id = auth.uid() OR
                      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "customers_create_reviews" ON reviews
    FOR INSERT WITH CHECK (customer_id = auth.uid());

CREATE POLICY "users_update_own_reviews" ON reviews
    FOR UPDATE USING (customer_id = auth.uid());

-- Review helpful votes policies
CREATE POLICY "users_manage_helpful_votes" ON review_helpful_votes
    FOR ALL USING (user_id = auth.uid());

-- =====================================================
-- INITIAL DATA
-- =====================================================

-- Insert default categories
INSERT INTO categories (name, slug, description, sort_order) VALUES
('Whiskey', 'whiskey', 'Premium whiskey collection', 1),
('Vodka', 'vodka', 'Premium vodka selection', 2),
('Rum', 'rum', 'Caribbean and premium rums', 3),
('Gin', 'gin', 'Artisanal and premium gins', 4),
('Brandy', 'brandy', 'Premium brandy and cognac', 5),
('Liqueurs', 'liqueurs', 'Sweet and flavored spirits', 6),
('Beer', 'beer', 'Craft and imported beers', 7),
('Wine', 'wine', 'Red, white, and sparkling wines', 8);

-- Insert default system settings
INSERT INTO system_settings (key, value, description, is_public) VALUES
('site_name', '"John Kivenge Liquor Stock"', 'Site name displayed in header', true),
('site_description', '"Premium liquor collection delivered to your door"', 'Site meta description', true),
('currency', '"RWF"', 'Default currency code', true),
('tax_rate', '18', 'Tax rate percentage', false),
('shipping_cost', '2000', 'Default shipping cost in cents', false),
('min_order_amount', '5000', 'Minimum order amount in cents', false),
('auto_approve_reviews', 'false', 'Automatically approve customer reviews', false);

-- =====================================================
-- VIEWS FOR COMMON QUERIES
-- =====================================================

-- Product details view
CREATE VIEW product_details AS
SELECT 
    p.*,
    c.name as category_name,
    s.name as supplier_name,
    COALESCE(AVG(r.rating), 0) as average_rating,
    COUNT(r.id) as review_count
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN suppliers s ON p.supplier_id = s.id
LEFT JOIN reviews r ON p.id = r.product_id AND r.is_approved = true
WHERE p.status = 'active'
GROUP BY p.id, c.name, s.name;

-- Order summary view
CREATE VIEW order_summary AS
SELECT 
    o.*,
    pr.first_name || ' ' || pr.last_name as customer_name,
    pr.email as customer_email,
    COUNT(oi.id) as item_count
FROM orders o
JOIN profiles pr ON o.customer_id = pr.id
LEFT JOIN order_items oi ON o.id = oi.order_id
GROUP BY o.id, pr.first_name, pr.last_name, pr.email;

-- =====================================================
-- COMPLETION
-- =====================================================

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Set up proper permissions for functions
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

COMMIT;
