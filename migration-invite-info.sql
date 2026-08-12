-- ============================================
-- MIGRACIÓN: Detalles públicos de la invitación
-- Devuelve la invitación con el nombre real del
-- invitante (dueño de la empresa), no el nombre
-- de invitación que escribe el dueño.
-- SECURITY DEFINER: funciona también sin login.
-- ============================================

CREATE OR REPLACE FUNCTION public.get_invitation_by_token(p_token uuid)
RETURNS TABLE (
  id uuid,
  company_id uuid,
  email text,
  status text,
  hourly_rate numeric,
  company_name text,
  owner_name text,
  owner_email text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    cm.id,
    cm.company_id,
    cm.email,
    cm.status,
    cm.hourly_rate,
    c.name::text,
    COALESCE(p.full_name, '')::text,
    cu.email::text
  FROM public.company_members cm
  JOIN public.companies c ON c.id = cm.company_id
  JOIN public.profiles p ON p.id = c.owner_id
  JOIN auth.users cu ON cu.id = c.owner_id
  WHERE cm.invitation_token = p_token;
END;
$$;

REVOKE ALL ON FUNCTION public.get_invitation_by_token(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_invitation_by_token(uuid) TO anon, authenticated;
