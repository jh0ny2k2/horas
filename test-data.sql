-- ============================================
-- DATOS DE PRUEBA - FUNCIONA DIRECTO
-- ============================================

-- IDs fake pero válidos para testing
DO $$
DECLARE
  empresa_id UUID := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
  empleado1_id UUID := 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';
  empleado2_id UUID := 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33';
  company_uuid UUID;
BEGIN
  -- Crear empresa
  INSERT INTO public.companies (id, owner_id, name, default_rate)
  VALUES (gen_random_uuid(), empresa_id, 'Constructora Julia', 10.00)
  RETURNING id INTO company_uuid;

  -- Perfil del dueño
  INSERT INTO public.profiles (id, role, hourly_rate, company_id, full_name)
  VALUES (empresa_id, 'company_owner', 15.00, company_uuid, 'Dueño Empresa');

  -- Perfiles de empleados
  INSERT INTO public.profiles (id, role, hourly_rate, company_id, full_name)
  VALUES (empleado1_id, 'employee', 10.00, company_uuid, 'Carlos García');

  INSERT INTO public.profiles (id, role, hourly_rate, company_id, full_name)
  VALUES (empleado2_id, 'employee', 10.00, company_uuid, 'María López');

  -- Agregar empleados a la empresa
  INSERT INTO public.company_members (company_id, email, user_id, status, hourly_rate)
  VALUES
    (company_uuid, 'empleado1@test.com', empleado1_id, 'accepted', 10.00),
    (company_uuid, 'empleado2@test.com', empleado2_id, 'accepted', 10.00);

  -- Turnos de prueba
  INSERT INTO public.work_shifts (user_id, work_date, start_time, end_time, break_minutes, notes, total_hours)
  VALUES
    (empleado1_id, CURRENT_DATE - 2, '08:00', '17:00', 60, 'Turno normal', 8.00),
    (empleado1_id, CURRENT_DATE - 1, '08:00', '16:30', 45, 'Medio día', 7.75),
    (empleado1_id, CURRENT_DATE, '07:30', '17:30', 60, 'Jornada completa', 9.00),
    (empleado2_id, CURRENT_DATE - 2, '09:00', '18:00', 60, 'Turno normal', 8.00),
    (empleado2_id, CURRENT_DATE - 1, '09:00', '17:00', 45, 'Turno corto', 7.25),
    (empleado2_id, CURRENT_DATE, '08:00', '17:00', 60, 'Normal', 8.00);

  RAISE NOTICE 'Datos de prueba creados correctamente';
END $$;
