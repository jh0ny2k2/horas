-- Agregar columna para controlar cambio de rol (solo 1 vez)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role_changed BOOLEAN DEFAULT FALSE;
