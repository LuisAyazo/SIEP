# Progreso del Sistema de Solicitudes

**Fecha:** 2025-12-17  
**Estado:** En Progreso

## ✅ Completado

### 1. Base de Datos y Storage

#### Migración de Storage (`20251217_configure_storage.sql`)
- ✅ Bucket `solicitudes` creado con límite de 50MB por archivo
- ✅ Tipos MIME permitidos: PDF, Excel, Word, imágenes
- ✅ Políticas RLS configuradas:
  - Usuarios pueden subir a sus propias carpetas
  - Acceso compartido según roles (funcionario, director, coordinador, comité)
  - Políticas de lectura, escritura, actualización y eliminación
- ✅ Funciones auxiliares:
  - `generate_storage_path()` - Genera rutas de archivos
  - `extract_project_name_from_excel()` - Extrae nombre del proyecto

#### Estructura de Carpetas
```
{user_id}/{solicitud_id}/{tipo_documento}/{filename}
```

### 2. Backend - Librería de Storage

#### Archivo: `lib/supabase/storage.ts`
Funciones implementadas:
- ✅ `uploadFile()` - Sube un archivo individual
- ✅ `uploadMultipleFiles()` - Sube múltiples archivos
- ✅ `deleteFile()` - Elimina un archivo
- ✅ `getSignedUrl()` - Genera URL firmada para descarga
- ✅ `listSolicitudFiles()` - Lista archivos de una solicitud

### 3. Backend - API de Solicitudes

#### Archivo: `app/api/solicitudes/route.ts`

**GET /api/solicitudes**
- ✅ Listado con filtros por rol:
  - Funcionarios: solo sus solicitudes
  - Directores: solicitudes de su centro
  - Comité: solicitudes asignadas a su grupo
- ✅ Paginación
- ✅ Búsqueda por texto
- ✅ Filtros: status, centro, prioridad

**POST /api/solicitudes** (En Progreso)
- ✅ Recibe FormData con archivos
- ✅ Validación de tipo de solicitud
- ✅ Verificación de acceso al centro
- ✅ Extracción de nombre de proyecto del Excel
- ✅ Creación de solicitud en BD con estado "nuevo"
- ✅ Upload de documentos a Storage:
  - Ficha técnica (Excel importado)
  - Formato 003 (requerido)
  - Contrato/Convenio (según tipo)
  - Documentos opcionales (coordinadores, disminución gasto)
- ✅ Actualización de paths en BD
- ✅ Asignación automática al director del centro
- ⏳ Pendiente: Notificación al director

### 4. Frontend - Componentes

Ya existentes y funcionando:
- ✅ `TipoSolicitudSelector` - Selector de tipo de solicitud
- ✅ `DocumentosUploader` - Upload de documentos según tipo
- ✅ `MetodoFichaTecnicaSelector` - Elegir importar Excel o formulario
- ✅ `ExcelDataViewer` - Visualización de datos del Excel
- ✅ `ConfirmacionSolicitud` - Resumen antes de enviar

## ⏳ En Progreso

### POST /api/solicitudes
- Falta integrar con el frontend
- Falta implementar notificaciones

## 📋 Pendiente

### 1. APIs de Transiciones de Estado

Necesarias para el workflow:
- [ ] `PATCH /api/solicitudes/[id]/recibir` - Director recibe solicitud
- [ ] `PATCH /api/solicitudes/[id]/enviar-comite` - Director envía a comité
- [ ] `PATCH /api/solicitudes/[id]/aprobar` - Comité aprueba
- [ ] `PATCH /api/solicitudes/[id]/observar` - Comité observa
- [ ] `PATCH /api/solicitudes/[id]/rechazar` - Comité/Director rechaza
- [ ] `PATCH /api/solicitudes/[id]/devolver` - Devolver al funcionario

### 2. Componentes UI

- [ ] `EstadoBadge` - Badge con colores según estado
- [ ] `DocumentosList` - Lista de documentos adjuntos
- [ ] `HistorialTimeline` - Timeline de cambios de estado

### 3. Vistas por Rol

- [ ] Vista Director: Revisar solicitud
- [ ] Vista Comité: Evaluar solicitud  
- [ ] Vista Coordinador: Solicitudes aprobadas
- [ ] Vista Funcionario: Editar solicitud observada

### 4. Generación de Documentos

- [ ] Generar Ficha Técnica (Excel) desde formulario
- [ ] Generar Resolución (Word/PDF) al aprobar
- [ ] Validar formato de Formato 003

### 5. Notificaciones

- [ ] Notificar al director cuando se crea solicitud
- [ ] Notificar al comité cuando se envía
- [ ] Notificar al funcionario cuando se aprueba/rechaza/observa
- [ ] Notificar al coordinador cuando se aprueba

## 🔄 Flujo de Estados Implementado

```
nuevo → recibido → en_comite → aprobado
                              ↓
                         observado → (vuelve a funcionario)
                              ↓
                         rechazado
```

## 📊 Documentos por Tipo de Solicitud

### Diplomado - Proyección Social
- Formato 003 ✅

### Diplomado - Extensión
- Formato 003 ✅
- Ficha Técnica (Excel) ✅
- Solicitud Coordinadores (opcional) ✅
- Disminución Gasto (opcional) ✅

### Contrato
- Formato 003 ✅
- Ficha Técnica (Excel) ✅
- Contrato ✅
- Solicitud Coordinadores (opcional) ✅
- Disminución Gasto (opcional) ✅

### Convenio
- Formato 003 ✅
- Ficha Técnica (Excel) ✅
- Convenio ✅
- Solicitud Coordinadores (opcional) ✅
- Disminución Gasto (opcional) ✅

## 🎯 Próximos Pasos

1. **Integrar frontend con API POST**
   - Modificar formulario de creación para enviar FormData
   - Manejar respuesta y redireccionar

2. **Implementar APIs de transiciones**
   - Empezar con `/recibir` (Director)
   - Continuar con `/enviar-comite`
   - Implementar `/aprobar`, `/observar`, `/rechazar`

3. **Crear vistas por rol**
   - Vista de detalle de solicitud
   - Acciones según rol y estado

4. **Sistema de notificaciones**
   - Integrar con tabla `notifications` existente
   - Enviar notificaciones en cada transición

## 📝 Notas Técnicas

- Storage usa estructura de carpetas por usuario y solicitud
- Políticas RLS permiten acceso compartido según roles
- Función `extract_project_name_from_excel()` limpia caracteres especiales
- FormData permite enviar archivos y datos en una sola petición
- Todos los uploads son transaccionales (si falla uno, se puede revertir)