# Integración con Google Sheets API - Validación de Fichas Técnicas

## 📋 Resumen Ejecutivo

Este documento describe la integración con Google Sheets API para validar fichas técnicas, permitiendo dos métodos de entrada:
1. **Subir Excel** - Validado contra plantilla de Google Sheets
2. **Formulario Web** - Que replica la estructura del Excel

**Fecha de Creación:** 2025-12-15  
**Estado:** 📝 Planificación

---

## 🎯 Objetivos

1. **Validación Automática:** Usar Google Sheets como plantilla de referencia
2. **Doble Entrada:** Excel o Formulario web
3. **Consistencia:** Ambos métodos generan el mismo resultado
4. **Extracción de Datos:** Obtener nombre del proyecto (Fila #10)
5. **Generación Automática:** Crear Excel desde formulario

---

## 🏗️ Arquitectura

```mermaid
flowchart TD
    A[Usuario en /solicitudes/create] --> B{Elige Método}
    
    B -->|Opción 1| C[Subir Excel]
    B -->|Opción 2| D[Llenar Formulario]
    
    C --> E[Validar contra Google Sheets]
    D --> F[Validar campos del formulario]
    
    E --> G{¿Válido?}
    F --> H[Generar Excel desde formulario]
    
    G -->|Sí| I[Extraer datos Fila #10]
    G -->|No| J[Mostrar errores]
    
    H --> I
    
    I --> K[Crear Solicitud]
    J --> A
    
    K --> L[Almacenar en Supabase Storage]
    L --> M[Continuar flujo de aprobación]
```

---

## 📊 Estructura de la Ficha Técnica (Google Sheets)

### Plantilla de Referencia

**URL de la Plantilla:** `https://docs.google.com/spreadsheets/d/{TEMPLATE_ID}`

### Estructura Esperada

| Fila | Columna A | Columna B | Descripción |
|------|-----------|-----------|-------------|
| 1 | FICHA TÉCNICA | | Título |
| 2 | | | |
| 3 | Información General | | Sección |
| 4 | Código del Proyecto | [valor] | |
| 5 | Nombre del Proyecto | [valor] | |
| 6 | Centro | [valor] | |
| 7 | Tipo de Proyecto | [valor] | Diplomado/Contrato/Convenio |
| 8 | Modalidad | [valor] | Proyección Social/Extensión |
| 9 | | | |
| **10** | **Nombre Completo del Proyecto** | **[valor]** | **IMPORTANTE: Se usa para directorio** |
| 11 | | | |
| 12 | Datos Académicos | | Sección |
| 13 | Duración (horas) | [valor] | |
| 14 | Número de Créditos | [valor] | |
| 15 | Fecha de Inicio | [valor] | |
| 16 | Fecha de Finalización | [valor] | |
| ... | ... | ... | ... |

### Campos Obligatorios

```typescript
interface FichaTecnica {
  // Información General
  codigoProyecto: string;
  nombreProyecto: string;
  nombreCompletoProyecto: string; // Fila #10 - CRÍTICO
  centro: string;
  tipoProyecto: 'diplomado' | 'contrato' | 'convenio';
  modalidad: 'proyeccion_social' | 'extension';
  
  // Datos Académicos
  duracionHoras: number;
  numeroCreditos?: number;
  fechaInicio: string;
  fechaFinalizacion: string;
  
  // Datos Financieros
  presupuestoTotal: number;
  valorMatricula?: number;
  numeroEstudiantes: number;
  
  // Coordinación
  coordinadorNombre: string;
  coordinadorEmail: string;
  coordinadorTelefono: string;
  
  // Descripción
  objetivoGeneral: string;
  objetivosEspecificos: string[];
  justificacion: string;
  metodologia: string;
  
  // Contenido
  modulos: Array<{
    nombre: string;
    duracion: number;
    temas: string[];
  }>;
}
```

---

## 🔧 Configuración de Google Sheets API

### 1. Crear Proyecto en Google Cloud Console

```bash
# Pasos:
1. Ir a https://console.cloud.google.com/
2. Crear nuevo proyecto: "SIEP-Fichas-Tecnicas"
3. Habilitar Google Sheets API
4. Crear credenciales (Service Account)
5. Descargar JSON de credenciales
```

### 2. Compartir Plantilla con Service Account

```
1. Abrir la plantilla de Google Sheets
2. Compartir con el email del Service Account
3. Dar permisos de "Viewer" (solo lectura)
```

### 3. Variables de Entorno

```bash
# .env.local
GOOGLE_SHEETS_TEMPLATE_ID=1abc...xyz
GOOGLE_SERVICE_ACCOUNT_EMAIL=siep@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

---

## 💻 Implementación

### Fase 1: Backend - API de Validación

#### `lib/google-sheets/client.ts`

```typescript
import { google } from 'googleapis';

export async function getGoogleSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const sheets = google.sheets({ version: 'v4', auth });
  return sheets;
}

export async function getTemplateStructure() {
  const sheets = await getGoogleSheetsClient();
  const templateId = process.env.GOOGLE_SHEETS_TEMPLATE_ID!;

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: templateId,
    range: 'A1:Z100', // Ajustar según necesidad
  });

  return response.data.values || [];
}
```

#### `lib/google-sheets/validator.ts`

```typescript
import * as XLSX from 'xlsx';
import { getTemplateStructure } from './client';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  data?: FichaTecnica;
}

export async function validateExcelAgainstTemplate(
  fileBuffer: Buffer
): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // 1. Leer el Excel subido
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const excelData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    // 2. Obtener estructura de la plantilla
    const templateData = await getTemplateStructure();

    // 3. Validar estructura
    const structureValid = validateStructure(excelData, templateData);
    if (!structureValid.valid) {
      errors.push(...structureValid.errors);
    }

    // 4. Validar campos obligatorios
    const fieldsValid = validateRequiredFields(excelData);
    if (!fieldsValid.valid) {
      errors.push(...fieldsValid.errors);
    }

    // 5. Extraer datos
    const extractedData = extractDataFromExcel(excelData);

    // 6. Validar nombre del proyecto (Fila #10)
    if (!extractedData.nombreCompletoProyecto) {
      errors.push('Fila #10: Nombre Completo del Proyecto es obligatorio');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      data: errors.length === 0 ? extractedData : undefined,
    };
  } catch (error: any) {
    return {
      valid: false,
      errors: [`Error al procesar el archivo: ${error.message}`],
      warnings: [],
    };
  }
}

function validateStructure(
  excelData: any[][],
  templateData: any[][]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validar que tenga al menos las filas críticas
  if (excelData.length < 10) {
    errors.push('El archivo debe tener al menos 10 filas');
  }

  // Validar encabezados críticos
  const criticalHeaders = [
    { row: 0, col: 0, expected: 'FICHA TÉCNICA' },
    { row: 3, col: 0, expected: 'Código del Proyecto' },
    { row: 9, col: 0, expected: 'Nombre Completo del Proyecto' },
  ];

  for (const header of criticalHeaders) {
    const cellValue = excelData[header.row]?.[header.col];
    if (cellValue !== header.expected) {
      errors.push(
        `Fila ${header.row + 1}: Se esperaba "${header.expected}" pero se encontró "${cellValue}"`
      );
    }
  }

  return { valid: errors.length === 0, errors };
}

function validateRequiredFields(excelData: any[][]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  const requiredFields = [
    { row: 4, col: 1, name: 'Nombre del Proyecto' },
    { row: 5, col: 1, name: 'Centro' },
    { row: 6, col: 1, name: 'Tipo de Proyecto' },
    { row: 9, col: 1, name: 'Nombre Completo del Proyecto' },
  ];

  for (const field of requiredFields) {
    const value = excelData[field.row]?.[field.col];
    if (!value || value.toString().trim() === '') {
      errors.push(`${field.name} (Fila ${field.row + 1}) es obligatorio`);
    }
  }

  return { valid: errors.length === 0, errors };
}

function extractDataFromExcel(excelData: any[][]): Partial<FichaTecnica> {
  return {
    codigoProyecto: excelData[3]?.[1]?.toString() || '',
    nombreProyecto: excelData[4]?.[1]?.toString() || '',
    centro: excelData[5]?.[1]?.toString() || '',
    tipoProyecto: excelData[6]?.[1]?.toString().toLowerCase() as any,
    modalidad: excelData[7]?.[1]?.toString().toLowerCase() as any,
    nombreCompletoProyecto: excelData[9]?.[1]?.toString() || '', // FILA #10
    // ... extraer más campos según la estructura
  };
}
```

#### `app/api/solicitudes/validate-excel/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { validateExcelAgainstTemplate } from '@/lib/google-sheets/validator';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No se proporcionó ningún archivo' },
        { status: 400 }
      );
    }

    // Convertir a buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Validar
    const result = await validateExcelAgainstTemplate(buffer);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error en validación:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
```

### Fase 2: Frontend - Selector de Método

#### `app/center/[centerSlug]/dashboard/solicitudes/create/page.tsx`

```typescript
'use client';

import { useState } from 'react';
import { FileSpreadsheet, FileText } from 'lucide-react';

type InputMethod = 'excel' | 'form' | null;

export default function CreateSolicitudPage() {
  const [inputMethod, setInputMethod] = useState<InputMethod>(null);

  if (!inputMethod) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Nueva Solicitud</h1>
        <p className="text-gray-600">
          Elige cómo deseas crear la ficha técnica
        </p>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Opción 1: Subir Excel */}
          <button
            onClick={() => setInputMethod('excel')}
            className="p-8 border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all group"
          >
            <FileSpreadsheet className="w-16 h-16 mx-auto text-green-600 group-hover:scale-110 transition-transform" />
            <h3 className="text-xl font-semibold mt-4">Subir Excel</h3>
            <p className="text-gray-600 mt-2">
              Sube un archivo Excel con la ficha técnica completa
            </p>
            <ul className="text-sm text-gray-500 mt-4 text-left space-y-1">
              <li>✓ Validación automática</li>
              <li>✓ Basado en plantilla oficial</li>
              <li>✓ Más rápido si ya tienes el Excel</li>
            </ul>
          </button>

          {/* Opción 2: Formulario */}
          <button
            onClick={() => setInputMethod('form')}
            className="p-8 border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all group"
          >
            <FileText className="w-16 h-16 mx-auto text-blue-600 group-hover:scale-110 transition-transform" />
            <h3 className="text-xl font-semibold mt-4">Llenar Formulario</h3>
            <p className="text-gray-600 mt-2">
              Completa la ficha técnica paso a paso en el navegador
            </p>
            <ul className="text-sm text-gray-500 mt-4 text-left space-y-1">
              <li>✓ Interfaz guiada</li>
              <li>✓ Validación en tiempo real</li>
              <li>✓ Genera Excel automáticamente</li>
            </ul>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {inputMethod === 'excel' && <ExcelUploadForm />}
      {inputMethod === 'form' && <FichaTecnicaForm />}
    </div>
  );
}
```

---

## ✅ Checklist de Implementación

### Fase 1: Configuración Google Sheets API
- [ ] Crear proyecto en Google Cloud Console
- [ ] Habilitar Google Sheets API
- [ ] Crear Service Account
- [ ] Descargar credenciales JSON
- [ ] Crear plantilla de Google Sheets
- [ ] Compartir plantilla con Service Account
- [ ] Configurar variables de entorno

### Fase 2: Backend - Validación
- [ ] Instalar dependencias: `googleapis`, `xlsx`
- [ ] Crear `lib/google-sheets/client.ts`
- [ ] Crear `lib/google-sheets/validator.ts`
- [ ] Crear API route `/api/solicitudes/validate-excel`
- [ ] Implementar extracción de Fila #10
- [ ] Crear tests unitarios de validación

### Fase 3: Frontend - Selector de Método
- [ ] Modificar página `/solicitudes/create`
- [ ] Crear componente `MethodSelector`
- [ ] Crear componente `ExcelUploadForm`
- [ ] Crear componente `FichaTecnicaForm`
- [ ] Implementar validación en tiempo real

### Fase 4: Generación de Excel desde Formulario
- [ ] Crear función `generateExcelFromForm`
- [ ] Usar librería `xlsx` para generar archivo
- [ ] Aplicar formato según plantilla
- [ ] Guardar en Supabase Storage

### Fase 5: Testing
- [ ] Probar validación con Excel válido
- [ ] Probar validación con Excel inválido
- [ ] Probar formulario completo
- [ ] Probar generación de Excel
- [ ] Probar extracción de nombre (Fila #10)

---

## 📦 Dependencias NPM

```bash
npm install googleapis xlsx
npm install -D @types/node
```

**package.json:**
```json
{
  "dependencies": {
    "googleapis": "^128.0.0",
    "xlsx": "^0.18.5"
  }
}
```

---

## 🔐 Seguridad

1. **Service Account:** Solo permisos de lectura en la plantilla
2. **Validación Server-Side:** Nunca confiar en validación del cliente
3. **Sanitización:** Limpiar datos extraídos del Excel
4. **Rate Limiting:** Limitar llamadas a Google Sheets API
5. **Secrets:** Usar variables de entorno, nunca hardcodear

---

## 📊 Ejemplo de Uso

### Flujo 1: Subir Excel

```typescript
// Usuario sube archivo
const file = event.target.files[0];

// Enviar a validación
const formData = new FormData();
formData.append('file', file);

const response = await fetch('/api/solicitudes/validate-excel', {
  method: 'POST',
  body: formData,
});

const result = await response.json();

if (result.valid) {
  // Continuar con creación de solicitud
  console.log('Nombre del proyecto:', result.data.nombreCompletoProyecto);
} else {
  // Mostrar errores
  console.error('Errores:', result.errors);
}
```

### Flujo 2: Formulario

```typescript
// Usuario completa formulario
const formData = {
  nombreProyecto: 'Diplomado en IA',
  nombreCompletoProyecto: 'Diplomado en Inteligencia Artificial Aplicada',
  // ... más campos
};

// Generar Excel
const excelBuffer = await generateExcelFromForm(formData);

// Subir a Storage
const { data } = await supabase.storage
  .from('documents')
  .upload(`fichas/${projectId}.xlsx`, excelBuffer);
```

---

## 🚀 Próximos Pasos

1. **Aprobar** este documento
2. **Crear** proyecto en Google Cloud
3. **Configurar** Service Account
4. **Crear** plantilla de Google Sheets
5. **Implementar** Fase 1 (Configuración)

---

**Última Actualización:** 2025-12-15  
**Versión:** 1.0  
**Estado:** 📝 Pendiente de Aprobación