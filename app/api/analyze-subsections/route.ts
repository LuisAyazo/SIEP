import { NextResponse } from 'next/server';
import { getTemplateStructure } from '@/lib/google-sheets/client';

export async function GET() {
  try {
    const templateData = await getTemplateStructure('FORMATO P&P');
    
    // Subsecciones a buscar
    const targetSubsections = [
      'GENERALIDADES',
      'JUSTIFICACIÓN',
      'ANTECEDENTES',
      'ALCANCE',
      'RESULTADOS Y/O IMPACTOS',
      'COMUNICACIONES',
      'CRONOGRAMA'
    ];
    
    const subsectionsData: Record<string, any> = {};
    let currentSubsection = '';
    let infoTecnicaSection = false;
    
    for (let i = 0; i < templateData.length; i++) {
      const row = templateData[i];
      const cellA = row[0]?.toString().trim() || '';
      const cellB = row[1]?.toString().trim() || '';
      const cellC = row[2]?.toString().trim() || '';
      const cellD = row[3]?.toString().trim() || '';
      
      // Detectar sección INFORMACIÓN TÉCNICA
      if (cellA.includes('INFORMACIÓN TÉCNICA') && !cellB) {
        infoTecnicaSection = true;
        continue;
      }
      
      // Salir si llegamos a otra sección principal
      if (infoTecnicaSection && cellA && !cellB && cellA.length > 3 && cellA === cellA.toUpperCase() && !targetSubsections.includes(cellA)) {
        // Verificar si es otra sección principal (no subsección)
        if (!cellA.includes('DESCRIPCIÓN')) {
          infoTecnicaSection = false;
          break;
        }
      }
      
      if (!infoTecnicaSection) continue;
      
      // Detectar subsección
      if (targetSubsections.includes(cellA) && cellB === 'DESCRIPCIÓN') {
        currentSubsection = cellA;
        subsectionsData[currentSubsection] = {
          name: cellA,
          startRow: i + 1,
          fields: [],
          hasTable: false,
          tableHeaders: [],
          tableRows: []
        };
        continue;
      }
      
      // Recopilar campos de la subsección actual
      if (currentSubsection && subsectionsData[currentSubsection]) {
        // Detectar si es una tabla (múltiples columnas con headers)
        if (cellA && cellB && cellC) {
          // Posible header de tabla
          const nextRow = templateData[i + 1];
          if (nextRow && nextRow[0] && nextRow[1] && nextRow[2]) {
            // Es una tabla
            subsectionsData[currentSubsection].hasTable = true;
            subsectionsData[currentSubsection].tableHeaders = [cellA, cellB, cellC, cellD].filter(Boolean);
            
            // Recopilar filas de la tabla
            let tableRowIndex = i + 1;
            while (tableRowIndex < templateData.length) {
              const tableRow = templateData[tableRowIndex];
              const tCellA = tableRow[0]?.toString().trim() || '';
              const tCellB = tableRow[1]?.toString().trim() || '';
              
              // Salir si encontramos otra subsección o sección
              if (targetSubsections.includes(tCellA) || (tCellA && !tCellB && tCellA.length > 3)) {
                break;
              }
              
              if (tCellA || tCellB) {
                subsectionsData[currentSubsection].tableRows.push({
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
        if (cellA && !targetSubsections.includes(cellA)) {
          subsectionsData[currentSubsection].fields.push({
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
      subsections: subsectionsData,
      summary: {
        total: Object.keys(subsectionsData).length,
        found: Object.keys(subsectionsData),
        missing: targetSubsections.filter(s => !subsectionsData[s])
      }
    });
    
  } catch (error: any) {
    console.error('Error analyzing subsections:', error);
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