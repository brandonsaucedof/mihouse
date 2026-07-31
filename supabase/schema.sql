-- 1. Create homes table
CREATE TABLE public.homes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  invite_code text UNIQUE NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create profiles table
CREATE TABLE public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email text,
  full_name text,
  home_id uuid REFERENCES public.homes(id) ON DELETE SET NULL,
  role text DEFAULT 'member'::text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create categories table
CREATE TABLE public.categories (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id uuid REFERENCES public.homes(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create inventory_items table
CREATE TABLE public.inventory_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id uuid REFERENCES public.homes(id) ON DELETE CASCADE,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  quantity numeric DEFAULT 0,
  unit text DEFAULT 'un',
  status text DEFAULT 'Suficiente',
  min_quantity numeric DEFAULT 1,
  type text DEFAULT 'permanente',
  is_archived boolean DEFAULT false,
  added_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Create shopping_items table
CREATE TABLE public.shopping_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id uuid REFERENCES public.homes(id) ON DELETE CASCADE,
  name text NOT NULL,
  is_purchased boolean DEFAULT false,
  week integer DEFAULT 1,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Create purchases table
CREATE TABLE public.purchases (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id uuid REFERENCES public.homes(id) ON DELETE CASCADE,
  total_amount numeric DEFAULT 0,
  store_name text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.homes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

-- === RLS POLICIES ===

-- Helper function to avoid infinite recursion when querying profiles
CREATE OR REPLACE FUNCTION public.get_user_home_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT home_id FROM public.profiles WHERE id = auth.uid();
$$;

-- 1. Homes: Anyone can create a home. Users can read/update their own home.
CREATE POLICY "Anyone can create a home" ON public.homes FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view any home to join" ON public.homes FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can update their home" ON public.homes FOR UPDATE USING (id = public.get_user_home_id());


-- 2. Profiles: Users can read profiles in their home. Users can insert/update their own profile.
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can view profiles in their home" ON public.profiles FOR SELECT USING (home_id = public.get_user_home_id() OR auth.uid() = id);

-- 3. Categories: Users can read/write categories in their home.
CREATE POLICY "Users can manage categories in their home" ON public.categories FOR ALL USING (home_id = public.get_user_home_id());

-- 4. Inventory: Users can read/write inventory in their home.
CREATE POLICY "Users can manage inventory in their home" ON public.inventory_items FOR ALL USING (home_id = public.get_user_home_id());

-- 5. Shopping: Users can read/write shopping items in their home.
CREATE POLICY "Users can manage shopping in their home" ON public.shopping_items FOR ALL USING (home_id = public.get_user_home_id());

-- 6. Purchases: Users can read/write purchases in their home.
CREATE POLICY "Users can manage purchases in their home" ON public.purchases FOR ALL USING (home_id = public.get_user_home_id());

-- 7. Eventos de compras (Fase 5 extra)
CREATE TABLE public.shopping_events (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    home_id uuid REFERENCES public.homes(id) ON DELETE CASCADE,
    name text NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.shopping_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage shopping events in their home" ON public.shopping_events FOR ALL USING (home_id = public.get_user_home_id());

-- Alter shopping items to support events
ALTER TABLE public.shopping_items ADD COLUMN event_id uuid REFERENCES public.shopping_events(id) ON DELETE CASCADE;

-- Alter shopping items to support categories, quantity and expected price
ALTER TABLE public.shopping_items ADD COLUMN category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL;
ALTER TABLE public.shopping_items ADD COLUMN quantity text;
ALTER TABLE public.shopping_items ADD COLUMN expected_price numeric;

-- Alter purchases to support week, event_id and items_summary
ALTER TABLE public.purchases ADD COLUMN week integer;
ALTER TABLE public.purchases ADD COLUMN event_id uuid REFERENCES public.shopping_events(id) ON DELETE SET NULL;
ALTER TABLE public.purchases ADD COLUMN items_summary jsonb;

-- Alter inventory_items to support restock_quantity
ALTER TABLE public.inventory_items ADD COLUMN restock_quantity numeric DEFAULT 1;
