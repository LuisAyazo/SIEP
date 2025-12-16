import * as XLSX from 'xlsx';
import { getTemplateStructure } from './client';

// Tipos de elementos en la ficha
export type ElementType = 'header' | 'section' | 'subsection' | 'field' | 'empty';

export interface TemplateElement {
  row: number;
  type: ElementType;
  label?: string;
  value?: string;
  required?: boolean;
  section?: string; // A qué sección principal pertenece
  subsection?: string; // A qué subsección pertenece
}

export interface ValidationError {
  row: number;
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  data?: {
    fichatecnica: Record<string, any>;
    formatopp: Record<string, any>;
  };
  structure?: {
    fichatecnica: TemplateElement[];
    formatopp: TemplateElement[];
  };
}

/**
 * Detecta si una celda es un encabezado de sección principal (negrita, mayúsculas, etc.)
 */
function isSectionHeader(cell: any, value: string): boolean {
  if (!value) return false;
  
  // Secciones principales (las que están solas en la columna A sin valor en B)
  const mainSectionKeywords = [
    'INFORMACIÓN TÉCNICA',
    'INFORMACIÓN PRESUPUESTAL',
    'INVERSIONES',
    'AUTORIZACIONES',
    'MODIFICACIONES',
  ];
  
  const upperValue = value.toUpperCase().trim();
  
  // Si es una sección principal conocida
  if (mainSectionKeywords.some(keyword => upperValue.includes(keyword))) {
    return true;
  }
  
  // Si está todo en mayúsculas y tiene más de 20 caracteres (probablemente es sección principal)
  if (upperValue === value && value.length > 20) {
    return true;
  }
  
  return false;
}

/**
 * Detecta si un campo es realmente un header de subsección
 * (tiene valor "DESCRIPCIÓN" y está en mayúsculas)
 */
function isSubsectionHeader(label: string, value: string): boolean {
  if (!label || !value) return false;
  
  const upperLabel = label.toUpperCase().trim();
  const upperValue = value.toUpperCase().trim();
  
  // Si el valor es "DESCRIPCIÓN" y el label está en mayúsculas
  if (upperValue === 'DESCRIPCIÓN' || upperValue === 'DESCRIPCION') {
    // Subsecciones conocidas dentro de INFORMACIÓN TÉCNICA
    const subsectionKeywords = [
      'GENERALIDADES',
      'JUSTIFICACIÓN',
      'JUSTIFICACION',
      'ANTECEDENTES',
      'OBJETIVOS',
      'METODOLOGÍA',
      'METODOLOGIA',
      'RESULTADOS',
      'IMPACTOS',
      'COMUNICACIONES',
      'CRONOGRAMA',
    ];
    
    if (subsectionKeywords.some(keyword => upperLabel.includes(keyword))) {
      return true;
    }
    
    // Si está todo en mayúsculas y tiene más de 5 caracteres
    if (upperLabel === label && label.length > 5) {
      return true;
    }
  }
  
  return false;
}

/**
 * Analiza la estructura de una hoja específica
 */
async function analyzeSheetStructure(sheetName: string): Promise<TemplateElement[]> {
  const templateData = await getTemplateStructure(sheetName);
  const structure: TemplateElement[] = [];
  let currentSection = '';
  let currentSubsection = '';
  
  for (let i = 0; i < templateData.length; i++) {
    const row = templateData[i];
    const cellA = row[0]?.toString().trim() || '';
    const cellB = row[1]?.toString().trim() || '';
    
    // Fila vacía
    if (!cellA && !cellB) {
      structure.push({
        row: i + 1,
        type: 'empty',
      });
      continue;
    }
    
    // Encabezado de sección principal
    if (isSectionHeader(null, cellA) && !cellB) {
      currentSection = cellA;
      currentSubsection = ''; // Reset subsección
      structure.push({
        row: i + 1,
        type: 'section',
        label: cellA,
        section: cellA,
      });
      continue;
    }
    
    // Encabezado general (primera fila, título del documento)
    if (i < 5 && cellA && !cellB) {
      structure.push({
        row: i + 1,
        type: 'header',
        label: cellA,
      });
      continue;
    }
    
    // Campo con etiqueta y valor
    if (cellA) {
      // Verificar si es un header de subsección
      if (isSubsectionHeader(cellA, cellB)) {
        currentSubsection = cellA;
        structure.push({
          row: i + 1,
          type: 'subsection',
          label: cellA,
          value: cellB,
          section: currentSection,
          subsection: cellA,
        });
        continue;
      }
      
      // Determinar si es obligatorio
      const isRequired = [
        'Código',
        'Nombre del Proyecto',
        'Tipo de Proyecto',
        'Centro Adscrito',
      ].some(field => cellA.toLowerCase().includes(field.toLowerCase()));
      
      structure.push({
        row: i + 1,
        type: 'field',
        label: cellA,
        value: cellB,
        required: isRequired,
        section: currentSection,
        subsection: currentSubsection,
      });
    }
  }
  
  return structure;
}

/**
 * Analiza la estructura de TODAS las hojas de la plantilla
 */
export async function analyzeTemplateStructure(): Promise<{
  fichatecnica: TemplateElement[];
  formatopp: TemplateElement[];
}> {
  console.log('[Validator] Analizando ambas hojas...');
  
  const [fichatecnica, formatopp] = await Promise.all([
    analyzeSheetStructure('FICHA TÉCNICA'),
    analyzeSheetStructure('FORMATO P&P'),
  ]);
  
  console.log('[Validator] Ficha Técnica:', fichatecnica.length, 'elementos');
  console.log('[Validator] Formato P&P:', formatopp.length, 'elementos');
  
  return { fichatecnica, formatopp };
}

/**
 * Valida un Excel contra la plantilla de Google Sheets
 */
export async function validateExcelAgainstTemplate(
  fileBuffer: Buffer
): Promise<ValidationResult> {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];
  
  try {
    console.log('[Validator] Iniciando validación...');
    
    // 1. Leer el Excel subido
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    
    // Buscar la hoja "FICHA TÉCNICA"
    let sheetName = 'FICHA TÉCNICA';
    if (!workbook.SheetNames.includes(sheetName)) {
      // Intentar con variaciones
      sheetName = workbook.SheetNames.find(name => 
        name.toLowerCase().includes('ficha') || 
        name.toLowerCase().includes('tecnica')
      ) || workbook.SheetNames[0];
      
      warnings.push({
        row: 0,
        field: 'Hoja',
        message: `No se encontró hoja "FICHA TÉCNICA", usando "${sheetName}"`,
        severity: 'warning',
      });
    }
    
    const worksheet = workbook.Sheets[sheetName];
    const excelData = XLSX.utils.sheet_to_json(worksheet, { 
      header: 1,
      defval: '', // Valor por defecto para celdas vacías
    }) as any[][];
    
    console.log('[Validator] Excel leído:', excelData.length, 'filas');
    
    // 2. Obtener estructura de AMBAS hojas de la plantilla
    console.log('[Validator] Analizando plantilla...');
    const templateStructure = await analyzeTemplateStructure();
    
    console.log('[Validator] Estructura analizada');
    
    // 3. Validar FICHA TÉCNICA
    console.log('[Validator] Validando FICHA TÉCNICA...');
    const fichaTecnicaValidation = validateSheet(
      excelData,
      templateStructure.fichatecnica,
      'FICHA TÉCNICA'
    );
    errors.push(...fichaTecnicaValidation.errors);
    warnings.push(...fichaTecnicaValidation.warnings);
    
    // 4. Validar FORMATO P&P (si existe en el Excel)
    console.log('[Validator] Buscando hoja FORMATO P&P...');
    const formatoPPSheet = workbook.SheetNames.find(name => 
      name.toLowerCase().includes('formato') || 
      name.toLowerCase().includes('p&p') ||
      name.toLowerCase().includes('pp')
    );
    
    let formatoPPData: any[][] = [];
    if (formatoPPSheet) {
      console.log('[Validator] Validando FORMATO P&P...');
      const formatoPPWorksheet = workbook.Sheets[formatoPPSheet];
      formatoPPData = XLSX.utils.sheet_to_json(formatoPPWorksheet, { 
        header: 1,
        defval: '',
      }) as any[][];
      
      const formatoPPValidation = validateSheet(
        formatoPPData,
        templateStructure.formatopp,
        'FORMATO P&P'
      );
      errors.push(...formatoPPValidation.errors);
      warnings.push(...formatoPPValidation.warnings);
    } else {
      warnings.push({
        row: 0,
        field: 'FORMATO P&P',
        message: 'No se encontró la hoja "FORMATO P&P" en el Excel',
        severity: 'warning',
      });
    }
    
    // 5. Extraer datos de ambas hojas
    const extractedData = {
      fichatecnica: extractDataFromExcel(excelData, templateStructure.fichatecnica),
      formatopp: formatoPPData.length > 0 
        ? extractDataFromExcel(formatoPPData, templateStructure.formatopp)
        : {},
    };
    
    console.log('[Validator] Validación completada');
    console.log('[Validator] Errores:', errors.length);
    console.log('[Validator] Advertencias:', warnings.length);
    
    return {
      valid: errors.length === 0,
      errors,
      warnings,
      data: errors.length === 0 ? extractedData : undefined,
      structure: templateStructure,
    };
  } catch (error: any) {
    console.error('[Validator] Error:', error);
    return {
      valid: false,
      errors: [{
        row: 0,
        field: 'General',
        message: `Error al procesar el archivo: ${error.message}`,
        severity: 'error',
      }],
      warnings: [],
    };
  }
}

/**
 * Valida una hoja completa (estructura, campos, secciones)
 */
function validateSheet(
  excelData: any[][],
  templateStructure: TemplateElement[],
  sheetName: string
): { errors: ValidationError[]; warnings: ValidationError[] } {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];
  
  // 1. Validar estructura general
  if (excelData.length < 10) {
    errors.push({
      row: 0,
      field: `${sheetName} - Estructura`,
      message: `La hoja "${sheetName}" debe tener al menos 10 filas`,
      severity: 'error',
    });
  }
  
  // 2. Validar secciones críticas
  const criticalSections = templateStructure.filter(el => el.type === 'section');
  
  for (const section of criticalSections) {
    const excelRow = excelData[section.row - 1];
    const excelValue = excelRow?.[0]?.toString().trim() || '';
    
    const normalizedTemplate = section.label?.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') || '';
    const normalizedExcel = excelValue.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    
    if (!normalizedExcel.includes(normalizedTemplate.substring(0, 10))) {
      warnings.push({
        row: section.row,
        field: `${sheetName} - Sección`,
        message: `Se esperaba sección "${section.label}" pero se encontró "${excelValue}"`,
        severity: 'warning',
      });
    }
  }
  
  // 3. Validar campos obligatorios
  const requiredFields = templateStructure.filter(el => el.type === 'field' && el.required);
  
  for (const field of requiredFields) {
    const excelRow = excelData[field.row - 1];
    const value = excelRow?.[1]?.toString().trim() || '';
    
    if (!value) {
      errors.push({
        row: field.row,
        field: `${sheetName} - ${field.label}`,
        message: `${field.label} es obligatorio`,
        severity: 'error',
      });
    }
  }
  
  return { errors, warnings };
}

/**
 * Extrae todos los datos del Excel
 */
function extractDataFromExcel(
  excelData: any[][],
  templateStructure: TemplateElement[]
): Record<string, any> {
  const data: Record<string, any> = {};
  const fields = templateStructure.filter(el => el.type === 'field');
  
  for (const field of fields) {
    const excelRow = excelData[field.row - 1];
    const value = excelRow?.[1]?.toString().trim() || '';
    
    if (field.label) {
      // Crear clave normalizada (sin espacios, minúsculas)
      const key = field.label
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_]/g, '');
      
      data[key] = value;
      
      // También guardar con el label original
      data[field.label] = value;
    }
  }
  
  return data;
}

/**
 * Genera un reporte legible de la validación
 */
export function generateValidationReport(result: ValidationResult): string {
  let report = '# Reporte de Validación\n\n';
  
  if (result.valid) {
    report += '✅ **Validación exitosa**\n\n';
  } else {
    report += '❌ **Validación fallida**\n\n';
  }
  
  if (result.errors.length > 0) {
    report += '## Errores\n\n';
    for (const error of result.errors) {
      report += `- **Fila ${error.row}** - ${error.field}: ${error.message}\n`;
    }
    report += '\n';
  }
  
  if (result.warnings.length > 0) {
    report += '## Advertencias\n\n';
    for (const warning of result.warnings) {
      report += `- **Fila ${warning.row}** - ${warning.field}: ${warning.message}\n`;
    }
    report += '\n';
  }
  
  if (result.structure) {
    report += '## Estructura Detectada\n\n';
    
    report += '### FICHA TÉCNICA\n';
    report += `- Total de elementos: ${result.structure.fichatecnica.length}\n`;
    report += `- Secciones: ${result.structure.fichatecnica.filter(el => el.type === 'section').length}\n`;
    report += `- Campos: ${result.structure.fichatecnica.filter(el => el.type === 'field').length}\n`;
    report += `- Campos obligatorios: ${result.structure.fichatecnica.filter(el => el.type === 'field' && el.required).length}\n\n`;
    
    report += '### FORMATO P&P\n';
    report += `- Total de elementos: ${result.structure.formatopp.length}\n`;
    report += `- Secciones: ${result.structure.formatopp.filter(el => el.type === 'section').length}\n`;
    report += `- Campos: ${result.structure.formatopp.filter(el => el.type === 'field').length}\n`;
    report += `- Campos obligatorios: ${result.structure.formatopp.filter(el => el.type === 'field' && el.required).length}\n`;
  }
  
  return report;
}