# Plan de Implementación - Formulario de Solicitudes

## Flujo Correcto del Formulario

### Paso 0: Seleccionar Tipo de Solicitud
**Opciones:**
1. **Diplomado - Proyección Social** (Gratis)
   - NO requiere ficha técnica
   - Solo requiere Formato 003
   
2. **Diplomado - Extensión**
   - Requiere ficha técnica
   - Requiere Formato 003
   - Opcionales: Solicitud coordinadores, Disminución gasto
   
3. **Contrato**
   - Requiere ficha técnica
   - Requiere Formato 003
   - Requiere Contrato
   - Opcionales: Solicitud coordinadores, Disminución gasto
   
4. **Convenio**
   - Requiere ficha técnica
   - Requiere Formato 003
   - Requiere Convenio
   - Opcionales: Solicitud coordinadores, Disminución gasto

---

### Paso 1: Información Básica
- Título de la solicitud
- Descripción
- Prioridad (baja/media/alta)

---

### Paso 2: Adjuntar Documentos
**Documentos según tipo seleccionado:**

#### Si es "Proyección Social":
- ✅ Formato 003 (requerido)
- Otros documentos (opcional)

#### Si es "Extensión":
- ✅ Formato 003 (requerido)
- Solicitud de Designación de Coordinadores (opcional)
- Disminución del Gasto Administrativo (opcional)
- Otros documentos (opcional)

#### Si es "Contrato":
- ✅ Formato 003 (requerido)
- ✅ Contrato (requerido)
- Solicitud de Designación de Coordinadores (opcional)
- Disminución del Gasto Administrativo (opcional)
- Otros documentos (opcional)

#### Si es "Convenio":
- ✅ Formato 003 (requerido)
- ✅ Convenio (requerido)
- Solicitud de Designación de Coordinadores (opcional)
- Disminución del Gasto Administrativo (opcional)
- Otros documentos (opcional)

---

### Paso 3: Ficha Técnica (SOLO si NO es "Proyección Social")

**Opción A: Importar Excel**
1. Usuario sube archivo Excel
2. Sistema valida formato usando `/api/validate-excel`
3. Sistema extrae datos y los muestra para revisión
4. Usuario confirma

**Opción B: Llenar Formulario**
1. Usuario completa formulario paso a paso:
   - INFORMACIÓN TÉCNICA
   - INFORMACIÓN PRESUPUESTAL
   - AUTORIZACIONES
2. Sistema genera Excel automáticamente al finalizar

**IMPORTANTE:** Este paso se OMITE completamente si el tipo es "Proyección Social"

---

### Paso 4: Confirmación y Envío
- Resumen de toda la información
- Lista de documentos adjuntos
- Botón "Crear Solicitud"

---

## Cambios Necesarios en el Código

### 1. Modificar estructura de steps:
```typescript
const [step, setStep] = useState(0);
// 0: Tipo de solicitud
// 1: Info básica
// 2: Documentos
// 3: Ficha técnica (solo si NO es proyección social)
// 4: Confirmación
```

### 2. Agregar estados:
```typescript
const [tipoSolicitud, setTipoSolicitud] = useState<TipoSolicitud | null>(null);
const [metodoFicha, setMetodoFicha] = useState<'excel' | 'formulario' | null>(null);
const [documentos, setDocumentos] = useState<DocumentoAdjunto[]>([]);
const [excelFile, setExcelFile] = useState<File | null>(null);
```

### 3. Lógica condicional:
```typescript
// Saltar paso 3 si es proyección social
const shouldShowFichaTecnica = tipoSolicitud !== 'diplomado_proyeccion_social';

// Ajustar navegación de pasos
const handleNext = () => {
  if (step === 2 && !shouldShowFichaTecnica) {
    setStep(4); // Saltar directo a confirmación
  } else {
    setStep(step + 1);
  }
};
```

### 4. Validaciones por tipo:
```typescript
const getRequiredDocuments = (tipo: TipoSolicitud) => {
  switch (tipo) {
    case 'diplomado_proyeccion_social':
      return ['formato_003'];
    case 'diplomado_extension':
      return ['formato_003'];
    case 'contrato':
      return ['formato_003', 'contrato'];
    case 'convenio':
      return ['formato_003', 'convenio'];
  }
};
```

---

## Estructura de Archivos en Gestor Documental

```
/proyectos/{nombre_proyecto}/
  /solicitud/
    - formato_003.pdf (requerido siempre)
    - ficha_tecnica.xlsx (si aplica)
    - contrato.pdf (si es contrato)
    - convenio.pdf (si es convenio)
    - solicitud_coordinadores.pdf (opcional)
    - disminucion_gasto.pdf (opcional)
    - otros_documentos/ (opcional)
```

---

## Próximos Pasos

1. ✅ Crear este documento de planificación
2. ⏳ Modificar el formulario para agregar Paso 0 (Tipo de solicitud)
3. ⏳ Modificar el formulario para agregar Paso 2 (Documentos)
4. ⏳ Modificar el formulario para hacer Paso 3 condicional
5. ⏳ Agregar lógica de validación de documentos
6. ⏳ Implementar guardado con API
7. ⏳ Implementar almacenamiento en Supabase Storage

---

**Fecha:** 2025-12-16
**Estado:** Planificación aprobada