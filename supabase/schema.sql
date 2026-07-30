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

-- Note: In a real app you'd write proper RLS policies here. 
-- For a quick start and testing, you might want to create a policy that allows users to see everything in their home.
