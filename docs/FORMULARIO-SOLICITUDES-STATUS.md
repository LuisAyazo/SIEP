# Estado del Formulario de Solicitudes

## ✅ Implementado

### 1. Flujo Multi-Paso Completo
El formulario ahora tiene un flujo de 5 pasos bien definido:

- **Paso 0**: Selección de tipo de solicitud
  - Contrato/Convenio
  - Diplomado Extensión
  - Diplomado Proyección Social
  
- **Paso 1**: Información básica
  - Título de la solicitud
  - Descripción
  - Prioridad (baja/media/alta)

- **Paso 2**: Adjuntar documentos
  - Documentos requeridos según tipo de solicitud
  - Documentos opcionales
  - Validación de documentos obligatorios

- **Paso 3**: Ficha Técnica (SOLO si NO es Proyección Social)
  - **Paso 3a**: Selección de método
    - Importar Excel
    - Llenar formulario manualmente
  - **Paso 3b**: Importar Excel (si seleccionó importar)
    - Upload de archivo .xlsx/.xls
    - Validación pendiente
  - **Paso 3c**: Formulario completo (si seleccionó formulario)
    - Todas las secciones de la ficha técnica
    - Navegación entre subsecciones

- **Paso 4**: Confirmación
  - Resumen de toda la información
  - Botón para crear solicitud

### 2. Componentes Modulares Creados

#### `TipoSolicitudSelector.tsx`
- Selector visual de 4 tipos de solicitud
- Muestra documentos requeridos por tipo
- Diseño con tarjetas clickeables

#### `DocumentosUploader.tsx`
- Gestión de documentos según tipo
- Función exportada `getDocumentosRequeridos()`
- Validación de documentos requeridos vs opcionales
- Indicadores visuales de estado

#### `MetodoFichaTecnicaSelector.tsx`
- Selector de método: Importar Excel vs Llenar Formulario
- Interfaz visual con iconos y descripciones
- Explicación clara de cada opción

#### `ConfirmacionSolicitud.tsx`
- Resumen final antes de enviar
- Muestra tipo, título, descripción, prioridad
- Lista de documentos adjuntos
- Texto adaptado según método de ficha técnica

### 3. Lógica Condicional Implementada

```typescript
// Determinar si debe mostrar paso de ficha técnica
const shouldShowFichaTecnica = tipoSolicitud !== 'diplomado_proyeccion_social';

// Estado para rastrear método seleccionado
const [metodoFichaTecnica, setMetodoFichaTecnica] = useState<'importar' | 'formulario' | null>(null);

// Saltar pasos según tipo
const handleNext = () => {
  if (step === 2 && !shouldShowFichaTecnica) {
    setStep(4); // Saltar directo a confirmación
  } else {
    setStep(step + 1);
  }
};
```

### 4. Navegación Mejorada

- Botones "Atrás" y "Siguiente" contextuales
- Botón "Cambiar Método" en pasos 3b y 3c
- Indicador de progreso visual (0-4)
- Salto automático de pasos para Proyección Social

## ⏳ Pendiente de Implementar

### 1. Funcionalidad de Importar Excel (Paso 3b)
- [ ] Validar archivo Excel subido
- [ ] Extraer datos del Excel
- [ ] Poblar formulario con datos extraídos
- [ ] Mostrar preview de datos importados
- [ ] Validar que contenga todas las secciones requeridas

### 2. Guardado de Solicitud
- [ ] Implementar API POST `/api/solicitudes`
- [ ] Subir documentos a Supabase Storage
- [ ] Generar Excel si se usó formulario
- [ ] Extraer nombre de proyecto de Excel (fila #10)
- [ ] Crear estructura de carpetas en gestor documental
- [ ] Guardar registro en base de datos con estado "nuevo"

### 3. Validaciones Adicionales
- [ ] Validar campos requeridos en ficha técnica
- [ ] Validar formato de archivos subidos
- [ ] Validar tamaño máximo de archivos
- [ ] Validar que Excel importado tenga estructura correcta

### 4. Mejoras de UX
- [ ] Agregar loading states durante upload
- [ ] Mostrar progreso de upload de archivos
- [ ] Agregar confirmación antes de cambiar de método
- [ ] Guardar borrador automáticamente
- [ ] Permitir continuar solicitud guardada

### 5. Generación de Documentos
- [ ] Generar Ficha Técnica (Excel) desde datos del formulario
- [ ] Generar Resolución (Word/PDF) al aprobar
- [ ] Validar formato de Formato 003 adjuntado

## 📋 Flujo Correcto Implementado

```
┌─────────────────────────────────────────────────────────────┐
│ PASO 0: Seleccionar Tipo de Solicitud                      │
│  ├─ Contrato/Convenio                                       │
│  ├─ Diplomado Extensión                                     │
│  ├─ Diplomado Proyección Social                             │
│  └─ (Muestra documentos requeridos por tipo)                │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ PASO 1: Información Básica                                  │
│  ├─ Título                                                   │
│  ├─ Descripción                                              │
│  └─ Prioridad                                                │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ PASO 2: Adjuntar Documentos                                 │
│  ├─ Formato 003 (requerido)                                 │
│  ├─ Contrato/Convenio (condicional)                         │
│  ├─ Solicitud Coordinadores (opcional)                      │
│  ├─ Disminución Gasto Admin (opcional)                      │
│  └─ Otros documentos (opcional)                             │
└─────────────────────────────────────────────────────────────┘
                          ↓
         ┌────────────────┴────────────────┐
         │                                  │
    SI es Proyección                   NO es Proyección
       Social                              Social
         │                                  │
         │                                  ↓
         │              ┌─────────────────────────────────────┐
         │              │ PASO 3a: Seleccionar Método         │
         │              │  ├─ Importar Excel                  │
         │              │  └─ Llenar Formulario               │
         │              └─────────────────────────────────────┘
         │                                  │
         │                    ┌─────────────┴─────────────┐
         │                    │                           │
         │              Importar Excel            Llenar Formulario
         │                    │                           │
         │                    ↓                           ↓
         │      ┌──────────────────────┐    ┌──────────────────────┐
         │      │ PASO 3b: Upload      │    │ PASO 3c: Formulario  │
         │      │ - Subir .xlsx/.xls   │    │ - Todas secciones    │
         │      │ - Validar estructura │    │ - Navegación         │
         │      └──────────────────────┘    └──────────────────────┘
         │                    │                           │
         └────────────────────┴───────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ PASO 4: Confirmación                                        │
│  ├─ Resumen de información                                  │
│  ├─ Lista de documentos                                     │
│  ├─ Método de ficha técnica                                 │
│  └─ Botón "Crear Solicitud"                                 │
└─────────────────────────────────────────────────────────────┘
```

## 🔧 Archivos Modificados/Creados

### Componentes Nuevos
- `components/solicitudes/TipoSolicitudSelector.tsx`
- `components/solicitudes/DocumentosUploader.tsx`
- `components/solicitudes/MetodoFichaTecnicaSelector.tsx`
- `components/solicitudes/ConfirmacionSolicitud.tsx`

### Archivos Modificados
- `app/center/[centerSlug]/solicitudes/create/page.tsx` (1627 líneas)
  - Agregado estado `tipoSolicitud`
  - Agregado estado `documentosAdjuntos`
  - Agregado estado `metodoFichaTecnica`
  - Implementada lógica de navegación condicional
  - Integrados todos los componentes modulares

## 🎯 Próximos Pasos Recomendados

1. **Implementar validación de Excel importado**
   - Usar la librería existente en `lib/google-sheets/validator.ts`
   - Validar estructura y secciones requeridas
   - Mostrar errores si falta información

2. **Implementar API de guardado**
   - Crear endpoint POST `/api/solicitudes`
   - Integrar con Supabase Storage para documentos
   - Generar Excel si se usó formulario
   - Crear registro en base de datos

3. **Agregar estados de loading**
   - Durante upload de archivos
   - Durante validación de Excel
   - Durante guardado de solicitud

4. **Implementar guardado de borrador**
   - Guardar progreso automáticamente
   - Permitir continuar solicitud guardada
   - Mostrar lista de borradores

## 📝 Notas Técnicas

- El formulario usa Next.js 15 con App Router
- Los params son Promise y se manejan correctamente
- Todos los componentes son client-side ('use client')
- La navegación es completamente controlada por estado
- Los documentos se validan antes de avanzar de paso
- El flujo se adapta automáticamente según el tipo de solicitud