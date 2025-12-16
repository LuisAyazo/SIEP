import { NextResponse } from 'next/server';
import { getTemplateStructure } from '@/lib/google-sheets/client';

interface SectionData {
  name: string;
  startRow: number;
  fields: Array<{
    row: number;
    label: string;
    value: string;
    type: string;
  }>;
  hasTable: boolean;
  tableHeaders: string[];
  tableRows: Array<{
    row: number;
    data: string[];
  }>;
}

export async function GET() {
  try {
    const templateData = await getTemplateStructure('FORMATO P&P');
    
    // Secciones principales y sus subsecciones
    const infoTecnicaSubsections = [
      'GENERALIDADES',
      'JUSTIFICACIÓN',
      'ANTECEDENTES',
      'ALCANCE',
      'RESULTADOS Y/O IMPACTOS',
      'COMUNICACIONES',
      'CRONOGRAMA'
    ];
    
    const infoPresupuestalSubsections = [
      'PRESUPUESTO',
      'GASTOS PERSONAL VINCULADO',
      'GASTOS PERSONAL INVITADO',
      'GASTOS GENERALES',
      'RECURSOS A CONTRATAR',
      'INVERSIONES',
      'FONDO ROTATORIO',
      'PLAN DE PAGO',
      'CONTRAPARTIDA',
      'ANEXOS'
    ];
    
    const autorizacionesSubsections = [
      'AUTORIZACIONES',
      'MODIFICACIONES'
    ];
    
    const result: Record<string, Record<string, SectionData>> = {
      'INFORMACIÓN TÉCNICA': {},
      'INFORMACIÓN PRESUPUESTAL': {},
      'AUTORIZACIONES': {}
    };
    
    let currentMainSection: 'INFORMACIÓN TÉCNICA' | 'INFORMACIÓN PRESUPUESTAL' | 'AUTORIZACIONES' | '' = '';
    let currentSubsection = '';
    
    for (let i = 0; i < templateData.length; i++) {
      const row = templateData[i];
      const cellA = row[0]?.toString().trim() || '';
      const cellB = row[1]?.toString().trim() || '';
      const cellC = row[2]?.toString().trim() || '';
      const cellD = row[3]?.toString().trim() || '';
      
      // Detectar sección principal
      if (cellA === 'INFORMACIÓN TÉCNICA' || cellA === 'INFORMACIÓN PRESUPUESTAL' || cellA === 'AUTORIZACIONES') {
        currentMainSection = cellA;
        continue;
      }
      
      if (!currentMainSection) continue;
      
      // Detectar subsección de INFORMACIÓN TÉCNICA (patrón: NOMBRE | DESCRIPCIÓN | vacío)
      const isInfoTecnica = currentMainSection === 'INFORMACIÓN TÉCNICA' &&
                           infoTecnicaSubsections.includes(cellA) &&
                           cellB === 'DESCRIPCIÓN';
      
      // Detectar subsección de INFORMACIÓN PRESUPUESTAL (patrón: headers en primera fila)
      const isInfoPresupuestal = currentMainSection === 'INFORMACIÓN PRESUPUESTAL' &&
                                infoPresupuestalSubsections.includes(cellA);
      
      // Detectar subsección de AUTORIZACIONES (patrón similar a INFORMACIÓN TÉCNICA)
      const isAutorizaciones = currentMainSection === 'AUTORIZACIONES' &&
                              autorizacionesSubsections.includes(cellA);
      
      if (isInfoTecnica || isAutorizaciones) {
        currentSubsection = cellA;
        
        result[currentMainSection][currentSubsection] = {
          name: cellA,
          startRow: i + 1,
          fields: [],
          hasTable: false,
          tableHeaders: [],
          tableRows: []
        };
        continue;
      }
      
      if (isInfoPresupuestal) {
        currentSubsection = cellA;
        
        // Para INFORMACIÓN PRESUPUESTAL, la primera fila ES el header de la tabla
        const headers = [];
        for (let col = 0; col < 20; col++) {
          const headerValue = row[col]?.toString().trim() || '';
          if (headerValue) {
            headers.push(headerValue);
          }
        }
        
        result[currentMainSection][currentSubsection] = {
          name: cellA,
          startRow: i + 1,
          fields: [],
          hasTable: true,
          tableHeaders: headers,
          tableRows: []
        };
        
        // Recopilar filas de datos
        let dataRowIndex = i + 1;
        
        while (dataRowIndex < templateData.length) {
          const dataRow = templateData[dataRowIndex];
          const dCellA = dataRow[0]?.toString().trim() || '';
          const dCellB = dataRow[1]?.toString().trim() || '';
          
          // Parar si encontramos otra subsección conocida
          if (infoPresupuestalSubsections.includes(dCellA)) {
            break;
          }
          
          // Parar si encontramos fila vacía
          const isEmptyRow = !dCellA && !dCellB && !dataRow[2]?.toString().trim();
          if (isEmptyRow) {
            break;
          }
          
          // Filtrar filas de comentarios/ejemplos
          const isCommentRow = dCellA.toLowerCase().includes('ejemplo:') ||
                              dCellA.toLowerCase().includes('descripción de la contrapartida');
          
          if (isCommentRow) {
            dataRowIndex++;
            continue; // Saltar esta fila
          }
          
          // Detectar fila de SUBTOTAL ANTES de agregar
          const isSubtotalRow = dCellA.toUpperCase().includes('SUBTOTAL') || dCellA.toUpperCase().includes('TOTAL');
          
          // Agregar fila de datos (incluyendo SUBTOTAL)
          if (dCellA || dCellB) {
            const rowData = [];
            for (let col = 0; col < headers.length; col++) {
              rowData.push(dataRow[col]?.toString().trim() || '');
            }
            result[currentMainSection][currentSubsection].tableRows.push({
              row: dataRowIndex + 1,
              data: rowData
            });
            
            // Si es SUBTOTAL, parar INMEDIATAMENTE después de agregarlo
            if (isSubtotalRow) {
              dataRowIndex++; // Avanzar una posición más
              break;
            }
          }
          
          dataRowIndex++;
        }
        
        // Agregar fila de TOTAL para PLAN DE PAGO si no existe
        if (cellA === 'PLAN DE PAGO') {
          const hasTotal = result[currentMainSection][currentSubsection].tableRows.some(
            row => row.data[0]?.toUpperCase().includes('TOTAL')
          );
          
          if (!hasTotal) {
            // Agregar fila de TOTAL con columnas vacías
            const totalRow = new Array(headers.length).fill('');
            totalRow[0] = 'TOTAL';
            result[currentMainSection][currentSubsection].tableRows.push({
              row: -1, // Fila generada
              data: totalRow
            });
          }
        }
        
        // Saltar TODAS las filas hasta la siguiente subsección conocida
        // para evitar que se procesen como fields
        while (dataRowIndex < templateData.length) {
          const skipRow = templateData[dataRowIndex];
          const skipCellA = skipRow[0]?.toString().trim() || '';
          
          // Parar si encontramos otra subsección conocida
          if (infoPresupuestalSubsections.includes(skipCellA)) {
            break;
          }
          
          dataRowIndex++;
        }
        
        i = dataRowIndex - 1;
        continue;
      }
      
      // Recopilar datos de la subsección actual
      if (currentSubsection && result[currentMainSection]?.[currentSubsection]) {
        const subsectionData = result[currentMainSection][currentSubsection];
        
        // Detectar tabla (3+ columnas con contenido)
        if (cellA && cellB && cellC) {
          const nextRow = templateData[i + 1];
          if (nextRow && nextRow[0] && nextRow[1]) {
            // Es una tabla
            subsectionData.hasTable = true;
            
            // Para RESULTADOS Y/O IMPACTOS y CRONOGRAMA, usar headers fijos
            if (currentSubsection === 'RESULTADOS Y/O IMPACTOS') {
              subsectionData.tableHeaders = ['RESULTADOS Y/O IMPACTOS', 'DESCRIPCIÓN', 'MEDIO DE VERIFICACIÓN'];
            } else if (currentSubsection === 'CRONOGRAMA') {
              subsectionData.tableHeaders = ['Fase o hito', 'DESCRIPCIÓN', 'FECHA INICIO', 'FECHA FIN'];
            } else {
              subsectionData.tableHeaders = [cellA, cellB, cellC, cellD].filter(Boolean);
            }
            
            // Recopilar filas de la tabla
            let tableRowIndex = i + 1;
            while (tableRowIndex < templateData.length) {
              const tableRow = templateData[tableRowIndex];
              const tCellA = tableRow[0]?.toString().trim() || '';
              const tCellB = tableRow[1]?.toString().trim() || '';
              
              // Salir si encontramos otra subsección o sección
              const allSubsections = [...infoTecnicaSubsections, ...infoPresupuestalSubsections];
              if (allSubsections.includes(tCellA) || 
                  (tCellA && tCellA === tCellA.toUpperCase() && tCellA.length > 10)) {
                break;
              }
              
              if (tCellA || tCellB) {
                subsectionData.tableRows.push({
                  row: tableRowIndex + 1,
                  data: [
                    tableRow[0]?.toString().trim() || '',
                    tableRow[1]?.toString().trim() || '',
                    tableRow[2]?.toString().trim() || '',
                    tableRow[3]?.toString().trim() || ''
                  ].filter(Boolean)
                });
              }
              
              tableRowIndex++;
            }
            
            i = tableRowIndex - 1;
            continue;
          }
        }
        
        // Campo simple (label + value)
        const allSubsections = [...infoTecnicaSubsections, ...infoPresupuestalSubsections];
        if (cellA && !allSubsections.includes(cellA)) {
          subsectionData.fields.push({
            row: i + 1,
            label: cellA,
            value: cellB,
            type: detectFieldType(cellA, cellB)
          });
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      sections: result,
      sectionNames: {
        'INFORMACIÓN TÉCNICA': infoTecnicaSubsections,
        'INFORMACIÓN PRESUPUESTAL': infoPresupuestalSubsections,
        'AUTORIZACIONES': autorizacionesSubsections
      }
    });
    
  } catch (error: any) {
    console.error('Error analyzing sections:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

function detectFieldType(label: string, value: string): string {
  const lowerLabel = label.toLowerCase();
  
  if (lowerLabel.includes('fecha') || lowerLabel.includes('date')) return 'date';
  if (lowerLabel.includes('valor') || lowerLabel.includes('precio') || lowerLabel.includes('costo') || 
      lowerLabel.includes('presupuesto') || value?.includes('$')) return 'money';
  if (lowerLabel.includes('plazo') || lowerLabel.includes('meses') || lowerLabel.includes('días') ||
      lowerLabel.includes('cantidad') || lowerLabel.includes('número')) return 'number';
  if (lowerLabel.includes('email') || lowerLabel.includes('correo')) return 'email';
  if (lowerLabel.includes('teléfono') || lowerLabel.includes('telefono')) return 'tel';
  if (lowerLabel.length > 100 || lowerLabel.includes('descripción') || lowerLabel.includes('descripcion') ||
      lowerLabel.includes('justificación') || lowerLabel.includes('objetivo')) return 'textarea';
  
  return 'text';
}