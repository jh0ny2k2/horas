-- Políticas de edición y borrado para payments
-- Necesarias para que persona/individual y empresa puedan editar y eliminar sus pagos.

-- Los usuarios pueden editar sus propios pagos
CREATE POLICY "Users can update own payments" ON payments
  FOR UPDATE USING (auth.uid() = user_id);

-- Los dueños de empresa pueden editar los pagos de su empresa
CREATE POLICY "Company owners can update company payments" ON payments
  FOR UPDATE USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid() AND role = 'company_owner'
    )
  );

-- Los usuarios pueden borrar sus propios pagos
CREATE POLICY "Users can delete own payments" ON payments
  FOR DELETE USING (auth.uid() = user_id);

-- Los dueños de empresa pueden borrar los pagos de su empresa
CREATE POLICY "Company owners can delete company payments" ON payments
  FOR DELETE USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid() AND role = 'company_owner'
    )
  );
