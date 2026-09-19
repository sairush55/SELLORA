-- ==========================================================
-- SELLORA — Retail Intelligence for Small Businesses
-- Database Schema for PostgreSQL / Supabase
-- PHASE 3: POS Billing + Busy Merchant Mode
-- ==========================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES (Store owners & operators)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. SHOPS (Multi-tenant shops)
CREATE TABLE IF NOT EXISTS public.shops (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  business_type TEXT NOT NULL DEFAULT 'supermarket',
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  currency_symbol TEXT NOT NULL DEFAULT '₹',
  timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
  address TEXT,
  gstin TEXT,
  onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
  onboarding_step INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CATEGORIES (Shop-isolated product groupings)
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(shop_id, name)
);

-- 4. SUPPLIERS (Vendors & distributors)
CREATE TABLE IF NOT EXISTS public.suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  address TEXT NOT NULL,
  lead_time INT NOT NULL DEFAULT 2, -- in days
  min_order_quantity INT NOT NULL DEFAULT 1, -- MOQ
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. PRODUCTS (Inventory catalog with supplier linkage)
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  sku TEXT NOT NULL,
  selling_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  cost_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  opening_stock INT NOT NULL DEFAULT 0,
  current_stock INT NOT NULL DEFAULT 0,
  min_stock INT NOT NULL DEFAULT 10,
  supplier_lead_time INT NOT NULL DEFAULT 2,
  min_order_quantity INT NOT NULL DEFAULT 1,
  unit TEXT NOT NULL DEFAULT 'Pcs',
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(shop_id, sku)
);

-- 6. SALES (Invoices, POS transactions & Daily Summaries)
CREATE TABLE IF NOT EXISTS public.sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL,
  sale_type TEXT NOT NULL CHECK (sale_type IN ('TRANSACTION', 'DAILY_SUMMARY')),
  subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  discount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  tax NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  payment_method TEXT NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('cash', 'upi', 'card', 'other')),
  customer_name TEXT,
  customer_phone TEXT,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'refunded', 'cancelled')),
  notes TEXT,
  sale_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(shop_id, invoice_number)
);

-- 7. SALE ITEMS (Line items per sale)
CREATE TABLE IF NOT EXISTS public.sale_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  sku TEXT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  cost_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. PAYMENTS (Audit log of financial settlements)
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'upi', 'card', 'other')),
  amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  reference_id TEXT,
  status TEXT NOT NULL DEFAULT 'completed',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. DAILY SALES SUMMARIES (Busy Merchant Mode)
CREATE TABLE IF NOT EXISTS public.daily_sales_summaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  summary_date DATE NOT NULL,
  total_items_sold INT NOT NULL DEFAULT 0,
  total_revenue NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  sale_id UUID REFERENCES public.sales(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(shop_id, summary_date) -- One summary per date per shop
);

-- 10. DAILY SALES SUMMARY ITEMS (Product batch records)
CREATE TABLE IF NOT EXISTS public.daily_sales_summary_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  summary_id UUID NOT NULL REFERENCES public.daily_sales_summaries(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  sku TEXT NOT NULL,
  quantity_sold INT NOT NULL DEFAULT 0,
  unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. INVENTORY MOVEMENTS (Restock, Adjustments, and Sales Ledger)
CREATE TABLE IF NOT EXISTS public.inventory_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  movement_type TEXT NOT NULL CHECK (
    movement_type IN ('RESTOCK', 'MANUAL_ADJUSTMENT', 'SALE', 'DAILY_SUMMARY_SALE', 'DAILY_SUMMARY_ADJUSTMENT')
  ),
  quantity_change INT NOT NULL,
  stock_before INT NOT NULL,
  stock_after INT NOT NULL,
  cost_per_unit NUMERIC(12, 2),
  notes TEXT,
  movement_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. STOCK ALERTS
CREATE TABLE IF NOT EXISTS public.stock_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'warning',
  resolved BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PERFORMANCE & ISOLATION INDEXES
CREATE INDEX IF NOT EXISTS idx_sales_shop_date ON public.sales(shop_id, sale_date DESC);
CREATE INDEX IF NOT EXISTS idx_sales_invoice ON public.sales(shop_id, invoice_number);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON public.sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_payments_sale ON public.payments(sale_id);
CREATE INDEX IF NOT EXISTS idx_daily_summaries_shop ON public.daily_sales_summaries(shop_id, summary_date);
CREATE INDEX IF NOT EXISTS idx_daily_summary_items_summary ON public.daily_sales_summary_items(summary_id);
CREATE INDEX IF NOT EXISTS idx_movements_shop_type ON public.inventory_movements(shop_id, movement_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_shop_stock ON public.products(shop_id, current_stock);

-- ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_sales_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_sales_summary_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_alerts ENABLE ROW LEVEL SECURITY;

-- Helper function to resolve the current authenticated tenant ID from session settings or user metadata
CREATE OR REPLACE FUNCTION public.current_tenant_id()
RETURNS UUID AS $$
BEGIN
  -- Check session setting app.current_tenant_id first
  IF NULLIF(current_setting('app.current_tenant_id', true), '') IS NOT NULL THEN
    RETURN current_setting('app.current_tenant_id', true)::UUID;
  END IF;

  -- Fallback to Supabase auth user metadata shop_id
  IF (auth.jwt() -> 'user_metadata' ->> 'shop_id') IS NOT NULL THEN
    RETURN (auth.jwt() -> 'user_metadata' ->> 'shop_id')::UUID;
  END IF;

  -- Fallback to shop owned by current user
  RETURN (SELECT id FROM public.shops WHERE owner_id = auth.uid() LIMIT 1);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 1. Shops Isolation Policy
CREATE POLICY tenant_isolation_shops ON public.shops
  FOR ALL
  USING (id = public.current_tenant_id() OR owner_id = auth.uid())
  WITH CHECK (id = public.current_tenant_id() OR owner_id = auth.uid());

-- 2. Categories Isolation Policy
CREATE POLICY tenant_isolation_categories ON public.categories
  FOR ALL
  USING (shop_id = public.current_tenant_id())
  WITH CHECK (shop_id = public.current_tenant_id());

-- 3. Suppliers Isolation Policy
CREATE POLICY tenant_isolation_suppliers ON public.suppliers
  FOR ALL
  USING (shop_id = public.current_tenant_id())
  WITH CHECK (shop_id = public.current_tenant_id());

-- 4. Products Isolation Policy
CREATE POLICY tenant_isolation_products ON public.products
  FOR ALL
  USING (shop_id = public.current_tenant_id())
  WITH CHECK (shop_id = public.current_tenant_id());

-- 5. Sales Isolation Policy
CREATE POLICY tenant_isolation_sales ON public.sales
  FOR ALL
  USING (shop_id = public.current_tenant_id())
  WITH CHECK (shop_id = public.current_tenant_id());

-- 6. Sale Items Isolation Policy (via sales join)
CREATE POLICY tenant_isolation_sale_items ON public.sale_items
  FOR ALL
  USING (sale_id IN (SELECT id FROM public.sales WHERE shop_id = public.current_tenant_id()))
  WITH CHECK (sale_id IN (SELECT id FROM public.sales WHERE shop_id = public.current_tenant_id()));

-- 7. Payments Isolation Policy
CREATE POLICY tenant_isolation_payments ON public.payments
  FOR ALL
  USING (shop_id = public.current_tenant_id())
  WITH CHECK (shop_id = public.current_tenant_id());

-- 8. Daily Sales Summaries Isolation Policy
CREATE POLICY tenant_isolation_daily_summaries ON public.daily_sales_summaries
  FOR ALL
  USING (shop_id = public.current_tenant_id())
  WITH CHECK (shop_id = public.current_tenant_id());

-- 9. Daily Sales Summary Items Isolation Policy (via summaries join)
CREATE POLICY tenant_isolation_daily_summary_items ON public.daily_sales_summary_items
  FOR ALL
  USING (summary_id IN (SELECT id FROM public.daily_sales_summaries WHERE shop_id = public.current_tenant_id()))
  WITH CHECK (summary_id IN (SELECT id FROM public.daily_sales_summaries WHERE shop_id = public.current_tenant_id()));

-- 10. Inventory Movements Isolation Policy
CREATE POLICY tenant_isolation_inventory_movements ON public.inventory_movements
  FOR ALL
  USING (shop_id = public.current_tenant_id())
  WITH CHECK (shop_id = public.current_tenant_id());

-- 11. Stock Alerts Isolation Policy
CREATE POLICY tenant_isolation_stock_alerts ON public.stock_alerts
  FOR ALL
  USING (shop_id = public.current_tenant_id())
  WITH CHECK (shop_id = public.current_tenant_id());

