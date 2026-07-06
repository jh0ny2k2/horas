-- Crear tabla work_shifts
CREATE TABLE IF NOT EXISTS public.work_shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  work_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  break_minutes INTEGER DEFAULT 0,
  notes TEXT DEFAULT '',
  total_hours NUMERIC(5,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índice para búsquedas por usuario
CREATE INDEX IF NOT EXISTS idx_work_shifts_user_id ON public.work_shifts(user_id);
CREATE INDEX IF NOT EXISTS idx_work_shifts_work_date ON public.work_shifts(work_date);

-- Habilitar RLS
ALTER TABLE public.work_shifts ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
-- Cada usuario solo puede ver sus propios registros
CREATE POLICY "Users can view their own shifts"
  ON public.work_shifts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Cada usuario puede crear sus propios registros
CREATE POLICY "Users can insert their own shifts"
  ON public.work_shifts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Cada usuario puede actualizar sus propios registros
CREATE POLICY "Users can update their own shifts"
  ON public.work_shifts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Cada usuario puede eliminar sus propios registros
CREATE POLICY "Users can delete their own shifts"
  ON public.work_shifts
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
