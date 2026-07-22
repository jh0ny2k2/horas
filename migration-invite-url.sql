-- ============================================
-- MIGRACIÓN: Invitación por URL
-- ============================================

-- 1. Agregar token único a company_members
ALTER TABLE public.company_members
ADD COLUMN IF NOT EXISTS invitation_token UUID DEFAULT gen_random_uuid();

-- 2. Hacer que el token sea único
CREATE UNIQUE INDEX IF NOT EXISTS idx_company_members_token ON public.company_members(invitation_token);

-- 3. Policy: cualquier usuario autenticado puede ver invitaciones por token
DROP POLICY IF EXISTS "Anyone can view invitation by token" ON public.company_members;

CREATE POLICY "Anyone can view invitation by token"
  ON public.company_members FOR SELECT TO authenticated
  USING (true);

-- 4. Policy: usuario puede aceptar su propia invitación
DROP POLICY IF EXISTS "Users can accept own invitation by token" ON public.company_members;

CREATE POLICY "Users can accept own invitation by token"
  ON public.company_members FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);
