-- Revisión de turnos: rechazo y devolución con comentario
-- El dueño puede rechazar un turno (no se cuenta) o devolverlo a pendiente
-- (el empleado debe corregirlo). En ambos casos puede dejar un comentario.

ALTER TABLE work_shifts ADD COLUMN IF NOT EXISTS rejected BOOLEAN DEFAULT FALSE;
ALTER TABLE work_shifts ADD COLUMN IF NOT EXISTS review_comment TEXT;
ALTER TABLE work_shifts ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;
ALTER TABLE work_shifts ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES auth.users(id);
