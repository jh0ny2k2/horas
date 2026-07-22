-- ============================================
-- MIGRACIÓN: Sistema de aprobación de horas
-- ============================================

-- 1. Agregar columna approved a work_shifts
ALTER TABLE public.work_shifts
ADD COLUMN IF NOT EXISTS approved BOOLEAN DEFAULT false;

-- 2. Actualizar registros existentes como aprobados (para que no se pierdan)
UPDATE public.work_shifts SET approved = true WHERE approved IS NULL;

-- 3. Policy: dueño puede aprobar/rechazar turnos de sus empleados
DROP POLICY IF EXISTS "Company owners can approve employee shifts" ON public.work_shifts;

CREATE POLICY "Company owners can approve employee shifts"
  ON public.work_shifts FOR UPDATE TO authenticated
  USING (
    user_id IN (
      SELECT user_id FROM public.company_members
      WHERE company_id IN (SELECT id FROM public.companies WHERE owner_id = auth.uid())
      AND status = 'accepted'
    )
  )
  WITH CHECK (
    user_id IN (
      SELECT user_id FROM public.company_members
      WHERE company_id IN (SELECT id FROM public.companies WHERE owner_id = auth.uid())
      AND status = 'accepted'
    )
  );
