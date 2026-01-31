# Configuración de Google Calendar

Esta guía te ayudará a configurar la integración con Google Calendar para sincronizar automáticamente las reuniones.

## Paso 1: Crear un proyecto en Google Cloud Console

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita la **Google Calendar API**:
   - Ve a "APIs & Services" > "Library"
   - Busca "Google Calendar API"
   - Haz clic en "Enable"

## Paso 2: Configurar OAuth 2.0

1. Ve a "APIs & Services" > "Credentials"
2. Haz clic en "Create Credentials" > "OAuth client ID"
3. Si es la primera vez, configura la pantalla de consentimiento:
   - Tipo de usuario: Interno (si es para tu organización) o Externo
   - Nombre de la aplicación: "Sistema de Gestión Universidad de Cartagena"
   - Email de soporte: tu email
   - Scopes: Agrega `https://www.googleapis.com/auth/calendar`
4. Crea las credenciales OAuth:
   - Tipo de aplicación: "Web application"
   - Nombre: "Sistema de Gestión - Web"
   - URIs de redireccionamiento autorizados:
     - Para desarrollo: `http://localhost:3000/api/google/callback`
     - Para producción: `https://tu-dominio.com/api/google/callback`

## Paso 3: Configurar variables de entorno

Copia el Client ID y Client Secret y agrégalos a tu archivo `.env.local`:

```env
# Google Calendar Integration
GOOGLE_CLIENT_ID=tu-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=tu-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/google/callback
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Para producción, actualiza las URLs:

```env
GOOGLE_REDIRECT_URI=https://tu-dominio.com/api/google/callback
NEXT_PUBLIC_APP_URL=https://tu-dominio.com
```

## Paso 4: Reiniciar el servidor

Después de configurar las variables de entorno, reinicia el servidor de desarrollo:

```bash
npm run dev
```

## Paso 5: Conectar Google Calendar

1. Inicia sesión en la aplicación
2. Ve a **Settings** > **Integrations** (http://localhost:3000/settings/integrations)
3. Haz clic en el botón "Conectar" en la sección de Google Calendar
4. Autoriza el acceso a tu cuenta de Google
5. Serás redirigido de vuelta a la aplicación

## Funcionalidades

Una vez conectado, la integración hará lo siguiente automáticamente:

### ✅ Creación de eventos
- Cuando crees una reunión en el sistema, se creará automáticamente un evento en tu Google Calendar
- Los participantes recibirán invitaciones por email
- El evento incluirá:
  - Título de la reunión
  - Descripción
  - Fecha y hora
  - Duración
  - URL de la reunión (Zoom, Meet, etc.)
  - Lista de participantes

### ✅ Recordatorios
- Email 24 horas antes
- Notificación popup 30 minutos antes

### ✅ Sincronización bidireccional
- Los cambios en el sistema se reflejan en Google Calendar
- El ID del evento de Google se guarda en la base de datos

## Solución de problemas

### Error: "Access denied"
- Verifica que hayas autorizado todos los permisos solicitados
- Asegúrate de que el scope `https://www.googleapis.com/auth/calendar` esté configurado

### Error: "Redirect URI mismatch"
- Verifica que la URI de redirección en Google Cloud Console coincida exactamente con `GOOGLE_REDIRECT_URI`
- No olvides incluir el protocolo (http:// o https://)

### Los eventos no se crean
- Verifica que tengas Google Calendar conectado en Settings > Integrations
- Revisa los logs del servidor para ver errores específicos
- Asegúrate de que el token no haya expirado (se renueva automáticamente con el refresh token)

### Desconectar Google Calendar
1. Ve a Settings > Integrations
2. Haz clic en "Desconectar"
3. Opcionalmente, revoca el acceso desde tu [cuenta de Google](https://myaccount.google.com/permissions)

## Seguridad

- Los tokens de acceso se almacenan encriptados en la base de datos
- Los tokens se renuevan automáticamente cuando expiran
- Solo el usuario que conectó su cuenta puede crear eventos en su calendario
- Los tokens se eliminan completamente al desconectar

## Limitaciones

- Solo el creador de la reunión puede sincronizar con su Google Calendar
- Los participantes recibirán invitaciones por email de Google
- La sincronización es unidireccional (del sistema a Google Calendar)
- Los cambios en Google Calendar no se reflejan en el sistema

## Próximas mejoras

- [ ] Sincronización bidireccional
- [ ] Soporte para múltiples calendarios
- [ ] Sincronización de disponibilidad
- [ ] Webhooks para actualizaciones en tiempo real
