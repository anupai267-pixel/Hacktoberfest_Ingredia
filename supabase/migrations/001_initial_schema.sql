-- ==============================================================================
-- INGREDIA DATABASE SCHEMA & ROW-LEVEL SECURITY MIGRATIONS
-- ==============================================================================

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  life_stages TEXT[] DEFAULT ARRAY['none']::TEXT[],
  diabetes_status TEXT DEFAULT 'none',
  lactose_intolerance TEXT DEFAULT 'no',
  allergies TEXT[] DEFAULT ARRAY[]::TEXT[],
  other_allergies TEXT DEFAULT '',
  preferences JSONB DEFAULT '{"isVegetarian": false, "isVegan": false, "avoidPalmOil": false, "avoidHighFructoseCornSyrup": false, "avoidArtificialSweeteners": false, "avoidArtificialColors": false, "customAvoidIngredients": []}'::JSONB,
  informed_consent_given BOOLEAN DEFAULT true,
  consent_timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Users can select own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can delete own profile"
  ON public.profiles FOR DELETE
  TO authenticated
  USING (auth.uid() = id);

-- 2. Scan History Table
CREATE TABLE IF NOT EXISTS public.scan_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  barcode TEXT NOT NULL,
  product_name TEXT NOT NULL,
  brand TEXT,
  image_url TEXT,
  verdict TEXT NOT NULL,
  source TEXT NOT NULL,
  scanned_at TIMESTAMPTZ DEFAULT NOW(),
  analysis_snapshot JSONB NOT NULL,
  product_snapshot JSONB NOT NULL
);

-- Enable RLS for Scan History
ALTER TABLE public.scan_history ENABLE ROW LEVEL SECURITY;

-- Scan History Policies
CREATE POLICY "Users can select own scan history"
  ON public.scan_history FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own scan records"
  ON public.scan_history FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own scan records"
  ON public.scan_history FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own scan records"
  ON public.scan_history FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 3. Indexes for fast query performance
CREATE INDEX IF NOT EXISTS idx_scan_history_user_id ON public.scan_history(user_id);
CREATE INDEX IF NOT EXISTS idx_scan_history_scanned_at ON public.scan_history(scanned_at DESC);
CREATE INDEX IF NOT EXISTS idx_scan_history_verdict ON public.scan_history(verdict);
