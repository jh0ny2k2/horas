-- ============================================
-- MIGRACIÓN SEGURA: Solo tablas nuevas
-- Tus datos de work_shifts NO se tocan
-- ============================================

-- 1. Tabla companies
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  default_rate NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_companies_owner_id ON public.companies(owner_id);

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners can view their company" ON public.companies;
DROP POLICY IF EXISTS "Owners can create companies" ON public.companies;
DROP POLICY IF EXISTS "Owners can update their company" ON public.companies;
DROP POLICY IF EXISTS "Owners can delete their company" ON public.companies;

CREATE POLICY "Owners can view their company"
  ON public.companies FOR SELECT TO authenticated
  USING (auth.uid() = owner_id);

CREATE POLICY "Owners can create companies"
  ON public.companies FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update their company"
  ON public.companies FOR UPDATE TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can delete their company"
  ON public.companies FOR DELETE TO authenticated
  USING (auth.uid() = owner_id);

-- 2. Tabla profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'individual' CHECK (role IN ('individual', 'company_owner', 'employee')),
  hourly_rate NUMERIC(10,2) DEFAULT 0,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  full_name TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_company_id ON public.profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Company owners can view their employees" ON public.profiles;
DROP POLICY IF EXISTS "Users can create their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Company owners can update employee profiles" ON public.profiles;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Company owners can view their employees"
  ON public.profiles FOR SELECT TO authenticated
  USING (
    company_id IN (
      SELECT id FROM public.companies WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can create their own profile"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Company owners can update employee profiles"
  ON public.profiles FOR UPDATE TO authenticated
  USING (
    company_id IN (
      SELECT id FROM public.companies WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT id FROM public.companies WHERE owner_id = auth.uid()
    )
  );

-- 3. Tabla company_members
CREATE TABLE IF NOT EXISTS public.company_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  hourly_rate NUMERIC(10,2) DEFAULT 0,
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(company_id, email)
);

CREATE INDEX IF NOT EXISTS idx_company_members_company_id ON public.company_members(company_id);
CREATE INDEX IF NOT EXISTS idx_company_members_email ON public.company_members(email);

ALTER TABLE public.company_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Company owners can view their members" ON public.company_members;
DROP POLICY IF EXISTS "Company owners can invite members" ON public.company_members;
DROP POLICY IF EXISTS "Company owners can update members" ON public.company_members;
DROP POLICY IF EXISTS "Company owners can delete members" ON public.company_members;
DROP POLICY IF EXISTS "Employees can view their membership" ON public.company_members;
DROP POLICY IF EXISTS "Employees can accept invitation" ON public.company_members;

CREATE POLICY "Company owners can view their members"
  ON public.company_members FOR SELECT TO authenticated
  USING (
    company_id IN (
      SELECT id FROM public.companies WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Company owners can invite members"
  ON public.company_members FOR INSERT TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT id FROM public.companies WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Company owners can update members"
  ON public.company_members FOR UPDATE TO authenticated
  USING (
    company_id IN (
      SELECT id FROM public.companies WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Company owners can delete members"
  ON public.company_members FOR DELETE TO authenticated
  USING (
    company_id IN (
      SELECT id FROM public.companies WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Employees can view their membership"
  ON public.company_members FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Employees can accept invitation"
  ON public.company_members FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 4. Nuevas policies para work_shifts (sin tocar la tabla)
DROP POLICY IF EXISTS "Company owners can view employee shifts" ON public.work_shifts;

CREATE POLICY "Company owners can view employee shifts"
  ON public.work_shifts FOR SELECT TO authenticated
  USING (
    user_id IN (
      SELECT user_id FROM public.company_members
      WHERE company_id IN (SELECT id FROM public.companies WHERE owner_id = auth.uid())
      AND status = 'accepted'
    )
  );
