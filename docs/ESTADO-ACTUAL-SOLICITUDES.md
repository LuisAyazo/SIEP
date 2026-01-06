# Estado Actual del Sistema de Solicitudes

**Fecha de Actualización:** 2025-12-17  
**Última Revisión:** 14:30 COT

---

## 📊 Resumen Ejecutivo

Este documento presenta el estado actual de implementación del sistema de flujo de solicitudes, comparando el plan original con lo completado hasta la fecha.

---

## ✅ Completado

### Fase 1: Base de Datos ✅ (100%)

| Tarea | Estado | Notas |
|-------|--------|-------|
| Crear tabla `user_groups` | ✅ | Migración `20251216_create_user_groups.sql` |
| Crear tabla `user_group_members` | ✅ | Migración `20251216_create_user_groups.sql` |
| Modificar tabla `solicitudes` | ✅ | Migración `20251216_solicitudes_workflow.sql` |
| Crear tabla `solicitud_historial` | ✅ | Migración `20251216_solicitudes_workflow.sql` |
| Configurar políticas RLS | ✅ | Todas las tablas tienen RLS configurado |
| Crear triggers auditoría | ✅ | Trigger `update_solicitud_historial` |
| Función validar transiciones | ✅ | `validate_solicitud_transition()` |
| Función validar documentos | ✅ | `validate_required_documents()` |

**Archivos:**
- [`supabase/migrations/20251216_create_user_groups.sql`](../supabase/migrations/20251216_create_user_groups.sql)
- [`supabase/migrations/20251216_solicitudes_workflow.sql`](../supabase/migrations/20251216_solicitudes_workflow.sql)

---

### Fase 6: Gestor Documental ✅ (100%)

| Tarea | Estado | Notas |
|-------|--------|-------|
| Configurar buckets Supabase Storage | ✅ | Bucket `solicitudes` con límite 50MB |
| Estructura de carpetas automática | ✅ | `{user_id}/{solicitud_id}/{tipo_documento}/` |
| Políticas RLS para Storage | ✅ | Acceso según rol (funcionario, director, comité) |
| Funciones auxiliares SQL | ✅ | `generate_storage_path()`, `extract_project_name_from_excel()` |
| Librería de Storage TypeScript | ✅ | `lib/supabase/storage.ts` |

**Archivos:**
- [`supabase/migrations/20251217_configure_storage.sql`](../supabase/migrations/20251217_configure_storage.sql)
- [`lib/supabase/storage.ts`](../lib/supabase/storage.ts)

**Funciones Disponibles:**
```typescript
uploadFile({ userId, solicitudId, tipoDocumento, file })
uploadMultipleFiles({ userId, solicitudId, files })
deleteFile(path)
getSignedUrl(path, expiresIn)
listSolicitudFiles(solicitudId)
```

---

### Sistema de Grupos (Comités) ✅ (100%)

| Tarea | Estado | Notas |
|-------|--------|-------|
| Permisos granulares | ✅ | `app/auth/permissions-granular.ts` |
| Menú en sidebar | ✅ | Agregado en layouts |
| Página de listado | ✅ | `/center/[centerSlug]/groups` |
| Crear grupo | ✅ | `/center/[centerSlug]/groups/create` |
| Editar grupo | ✅ | `/center/[centerSlug]/groups/[id]/edit` |
| Gestionar miembros | ✅ | `/center/[centerSlug]/groups/[id]` |
| Eliminar grupo | ✅ | Funcionalidad implementada |
| APIs completas | ✅ | CRUD completo + gestión de miembros |

**Archivos:**
- [`app/center/[centerSlug]/groups/page.tsx`](../app/center/[centerSlug]/groups/page.tsx)
- [`app/center/[centerSlug]/groups/create/page.tsx`](../app/center/[centerSlug]/groups/create/page.tsx)
- [`app/center/[centerSlug]/groups/[id]/page.tsx`](../app/center/[centerSlug]/groups/[id]/page.tsx)
- [`app/center/[centerSlug]/groups/[id]/edit/page.tsx`](../app/center/[centerSlug]/groups/[id]/edit/page.tsx)

---

### Fase 4: Frontend - Componentes de Solicitudes ✅ (Parcial - 60%)

| Componente | Estado | Ubicación |
|------------|--------|-----------|
| `TipoSolicitudSelector` | ✅ | `components/solicitudes/TipoSolicitudSelector.tsx` |
| `DocumentosUploader` | ✅ | `components/solicitudes/DocumentosUploader.tsx` |
| `MetodoFichaTecnicaSelector` | ✅ | `components/solicitudes/MetodoFichaTecnicaSelector.tsx` |
| `ExcelDataViewer` | ✅ | `components/solicitudes/ExcelDataViewer.tsx` |
| `ConfirmacionSolicitud` | ✅ | `components/solicitudes/ConfirmacionSolicitud.tsx` |
| `EstadoBadge` | ❌ | Pendiente |
| `DocumentosList` | ❌ | Pendiente |
| `HistorialTimeline` | ❌ | Pendiente |

---

### Fase 5: Frontend - Vistas ✅ (Parcial - 25%)

| Vista | Estado | Ubicación |
|-------|--------|-----------|
| Crear Solicitud (Funcionario) | ✅ | `app/center/[centerSlug]/solicitudes/create/page.tsx` |
| Listado de Solicitudes | ✅ | `app/center/[centerSlug]/solicitudes/page.tsx` |
| Layout de Solicitudes | ✅ | `app/center/[centerSlug]/solicitudes/layout.tsx` |
| Detalle de Solicitud | ❌ | Pendiente |
| Vista Director | ❌ | Pendiente |
| Vista Comité | ❌ | Pendiente |
| Vista Coordinador | ❌ | Pendiente |

---

## 🚧 En Progreso

### Fase 3: Backend API (40%)

| Endpoint | Estado | Notas |
|----------|--------|-------|
| `POST /api/solicitudes` | 🚧 | Implementado pero sin probar |
| `GET /api/solicitudes` | ✅ | Con filtros por rol |
| `GET /api/solicitudes/[id]` | ✅ | Básico implementado |
| `PATCH /api/solicitudes/[id]/recibir` | ❌ | Pendiente |
| `PATCH /api/solicitudes/[id]/enviar-comite` | ❌ | Pendiente |
| `PATCH /api/solicitudes/[id]/aprobar` | ❌ | Pendiente |
| `PATCH /api/solicitudes/[id]/observar` | ❌ | Pendiente |
| `PATCH /api/solicitudes/[id]/rechazar` | ❌ | Pendiente |
| `PATCH /api/solicitudes/[id]/devolver` | ❌ | Pendiente |

**Archivo:** [`app/api/solicitudes/route.ts`](../app/api/solicitudes/route.ts)

**POST /api/solicitudes - Funcionalidad Implementada:**
- ✅ Recibe FormData con archivos
- ✅ Valida tipo de solicitud y acceso al centro
- ✅ Extrae nombre de proyecto del Excel (usando función SQL)
- ✅ Crea registro en BD con estado "nuevo"
- ✅ Upload de documentos a Storage
- ✅ Actualiza paths en BD
- ✅ Asigna automáticamente al director del centro

**Pendiente de Probar:**
- 🧪 Crear solicitud completa desde el frontend
- 🧪 Validar que los archivos se suban correctamente
- 🧪 Verificar extracción del nombre del proyecto
- 🧪 Confirmar asignación al director

---

## ❌ Pendiente

### Fase 2: Backend - Validaciones y Generación (0%)

| Tarea | Estado | Prioridad |
|-------|--------|-----------|
| Generar Ficha Técnica (Excel) desde formulario | ❌ | 🔴 Alta |
| Extraer nombre de proyecto de Excel (fila #10) | ✅ | ✅ Completado (función SQL) |
| Generar Resolución (Word/PDF) | ❌ | 🟡 Media |
| Validar formato Formato 003 | ❌ | 🟡 Media |

**Notas:**
- La extracción del nombre del proyecto ya está implementada como función SQL en la migración de Storage
- La generación de Ficha Técnica es crítica para el flujo completo
- La generación de Resolución solo se necesita al aprobar

---

### Fase 3: Backend API - Transiciones de Estado (0%)

**Todas las rutas de transición están pendientes:**

```
❌ PATCH /api/solicitudes/[id]/recibir
❌ PATCH /api/solicitudes/[id]/enviar-comite
❌ PATCH /api/solicitudes/[id]/aprobar
❌ PATCH /api/solicitudes/[id]/observar
❌ PATCH /api/solicitudes/[id]/rechazar
❌ PATCH /api/solicitudes/[id]/devolver
```

**Cada endpoint debe:**
1. Validar permisos del usuario
2. Validar transición de estado (usando función SQL)
3. Actualizar estado en BD
4. Crear registro en historial (trigger automático)
5. Enviar notificaciones
6. Retornar solicitud actualizada

---

### Fase 4: Frontend - Componentes Faltantes (0%)

| Componente | Descripción | Prioridad |
|------------|-------------|-----------|
| `EstadoBadge` | Badge con colores según estado | 🔴 Alta |
| `DocumentosList` | Lista de documentos con descarga | 🔴 Alta |
| `HistorialTimeline` | Timeline de cambios de estado | 🟡 Media |
| `ComentariosPanel` | Panel de comentarios | 🟢 Baja |

---

### Fase 5: Frontend - Vistas por Rol (0%)

| Vista | Descripción | Prioridad |
|-------|-------------|-----------|
| Detalle de Solicitud | Vista completa con documentos e historial | 🔴 Alta |
| Vista Director | Revisar y gestionar solicitudes | 🔴 Alta |
| Vista Comité | Evaluar solicitudes | 🔴 Alta |
| Vista Coordinador | Ver solicitudes aprobadas | 🟡 Media |
| Editar Solicitud | Solo en estado nuevo/observado | 🟡 Media |

---

### Fase 7: Notificaciones (0%)

| Tarea | Estado | Prioridad |
|-------|--------|-----------|
| Integrar con sistema existente | ❌ | 🔴 Alta |
| Notificaciones por transición | ❌ | 🔴 Alta |
| Email opcional | ❌ | 🟢 Baja |
| Dashboard de notificaciones | ❌ | 🟡 Media |

---

### Fase 8: Generación de Documentos (0%)

| Tarea | Estado | Prioridad |
|-------|--------|-----------|
| Generar Ficha Técnica (Excel) | ❌ | 🔴 Alta |
| Generar Resolución (Word/PDF) | ❌ | 🟡 Media |
| Plantillas editables | ❌ | 🟢 Baja |
| Validar formato Formato 003 | ❌ | 🟡 Media |

---

## 📋 Próximos Pasos Recomendados

### Prioridad 1: Completar Flujo Básico (1-2 días)

1. **Probar creación de solicitudes** 🧪
   - Crear solicitud desde frontend
   - Validar upload de archivos
   - Verificar creación en BD

2. **Implementar transiciones básicas** 🔄
   - `PATCH /api/solicitudes/[id]/recibir`
   - `PATCH /api/solicitudes/[id]/enviar-comite`
   - `PATCH /api/solicitudes/[id]/aprobar`

3. **Crear componentes esenciales** 🎨
   - `EstadoBadge`
   - `DocumentosList`
   - Vista de detalle de solicitud

### Prioridad 2: Vistas por Rol (2-3 días)

4. **Vista Director**
   - Listado de solicitudes pendientes
   - Acciones: Recibir, Rechazar, Enviar a Comité

5. **Vista Comité**
   - Listado de solicitudes en evaluación
   - Acciones: Aprobar, Rechazar, Observar

6. **Vista Coordinador**
   - Listado de solicitudes aprobadas
   - Solo lectura

### Prioridad 3: Generación de Documentos (3-4 días)

7. **Generar Ficha Técnica (Excel)**
   - Librería para crear Excel desde datos del formulario
   - Aplicar formato según plantilla

8. **Generar Resolución (Word/PDF)**
   - Plantilla de resolución
   - Reemplazo de variables
   - Generación de PDF

### Prioridad 4: Notificaciones (1-2 días)

9. **Sistema de Notificaciones**
   - Integrar con `NotificationPanel` existente
   - Crear notificaciones por cada transición
   - Dashboard de notificaciones pendientes

---

## 🎯 Métricas de Progreso

| Fase | Completado | Pendiente | Progreso |
|------|------------|-----------|----------|
| Fase 1: Base de Datos | 8/8 | 0/8 | 100% ✅ |
| Fase 2: Validaciones | 1/4 | 3/4 | 25% 🟡 |
| Fase 3: Backend API | 3/9 | 6/9 | 33% 🟡 |
| Fase 4: Componentes | 5/8 | 3/8 | 63% 🟡 |
| Fase 5: Vistas | 3/8 | 5/8 | 38% 🟡 |
| Fase 6: Storage | 5/5 | 0/5 | 100% ✅ |
| Fase 7: Notificaciones | 0/4 | 4/4 | 0% ❌ |
| Fase 8: Documentos | 0/4 | 4/4 | 0% ❌ |
| **TOTAL** | **25/50** | **25/50** | **50%** 🟡 |

---

## 📝 Notas Importantes

### Decisiones Técnicas

1. **Grupos = Comités**: Se decidió usar el sistema de grupos (`user_groups`) para representar comités, evitando duplicación de tablas.

2. **Storage Path**: Se usa la estructura `{user_id}/{solicitud_id}/{tipo_documento}/{filename}` para organizar documentos.

3. **Extracción de Nombre**: Se implementó como función SQL (`extract_project_name_from_excel()`) que se ejecuta en el servidor de Supabase.

4. **Validación de Transiciones**: Se usa función SQL (`validate_solicitud_transition()`) para garantizar que las transiciones sean válidas.

### Cambios Respecto al Plan Original

1. **Comités → Grupos**: En lugar de crear tablas `comites` y `comite_miembros`, se usa el sistema de grupos existente.

2. **Formato 003**: Se corrigió la documentación - es adjuntado por el funcionario, no generado automáticamente.

3. **Rutas**: Se movieron todas las secciones fuera de `/dashboard/` para simplificar la estructura.

---

## 🔗 Referencias

- [Documentación del Workflow](./WORKFLOW-SOLICITUDES.md)
- [Progreso Detallado](./PROGRESO-SOLICITUDES.md)
- [Plan del Formulario](./PLAN-FORMULARIO-SOLICITUDES.md)
- [Estado del Formulario](./FORMULARIO-SOLICITUDES-STATUS.md)

---

**Última Actualización:** 2025-12-17 14:30 COT  
**Próxima Revisión:** Después de completar Prioridad 1