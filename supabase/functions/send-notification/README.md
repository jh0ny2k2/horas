# Send Notification Function

Edge Function para enviar notificaciones push usando Firebase Cloud Messaging API v1.

## Configuración

### 1. Variable de entorno en Supabase

Agregar `FIREBASE_SERVICE_ACCOUNT` en Supabase → Settings → Edge Functions → Secrets.

El valor debe ser el contenido completo del archivo JSON de la cuenta de servicio de Firebase:

```json
{
  "type": "service_account",
  "project_id": "tu-project-id",
  "private_key": "...",
  "client_email": "...",
  ...
}
```

### 2. Ejecutar la función

```bash
supabase functions deploy send-notification
```

### 3. Usar desde la app

```typescript
const { data, error } = await supabase.functions.invoke('send-notification', {
  body: {
    user_id: 'uuid-del-usuario',
    title: 'Nueva notificación',
    body: 'Tienes un nuevo mensaje',
    data: { screen: 'notifications', id: '123' }
  }
})
```

### 4. Usar desde un trigger de Supabase (Database Webhook)

```sql
-- Ejemplo: notificar al dueño cuando un empleado registra horas
CREATE OR REPLACE FUNCTION notify_company_owner()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/send-notification',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object(
      'user_id', (SELECT owner_id FROM companies WHERE id = NEW.company_id),
      'title', 'Horas registradas',
      'body', NEW.hours || ' horas registradas',
      'data', jsonb_build_object('screen', 'history')
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```
