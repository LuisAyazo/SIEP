import { NextResponse } from 'next/server';
import { getTemplateStructure } from '@/lib/google-sheets/client';

export async function GET() {
  try {
    const templateData = await getTemplateStructure('FORMATO P&P');
    
    // Buscar el inicio de INFORMACIÓN PRESUPUESTAL
    let startRow = -1;
    
    for (let i = 0; i < templateData.length; i++) {
      const cellA = templateData[i][0]?.toString().trim() || '';
      
      if (cellA === 'INFORMACIÓN PRESUPUESTAL') {
        startRow = i;
        break;
      }
    }
    
    if (startRow === -1) {
      return NextResponse.json({
        success: false,
        error: 'No se encontró INFORMACIÓN PRESUPUESTAL'
      });
    }
    
    // Subsecciones conocidas de INFORMACIÓN PRESUPUESTAL
    const knownSubsections = [
      'PRESUPUESTO',
      'GASTOS PERSONAL VINCULADO',
      'GASTOS PERSONAL INVITADO',
      'GASTOS GENERALES',
      'GASTOS RECURSOS A CONTRATAR'
    ];
    
    const subsections: Record<string, any> = {};
    
    // Buscar cada subsección
    for (let i = startRow; i < templateData.length; i++) {
      const row = templateData[i];
      const cellA = row[0]?.toString().trim() || '';
      const cellB = row[1]?.toString().trim() || '';
      const cellC = row[2]?.toString().trim() || '';
      const cellD = row[3]?.toString().trim() || '';
      const cellE = row[4]?.toString().trim() || '';
      const cellF = row[5]?.toString().trim() || '';
      
      // Detectar si esta fila es un header de subsección
      const isSubsectionHeader = knownSubsections.some(name => cellA === name);
      
      if (isSubsectionHeader) {
        const subsectionName = cellA;
        
        // Recopilar headers (leer hasta 20 columnas)
        const headers = [];
        for (let col = 0; col < 20; col++) {
          const headerValue = row[col]?.toString().trim() || '';
          if (headerValue) {
            headers.push(headerValue);
          }
        }
        
        subsections[subsectionName] = {
          name: subsectionName,
          startRow: i + 1,
          type: 'table',
          headers: headers,
          rows: []
        };
        
        // Recopilar filas de datos hasta encontrar otra subsección o fila vacía
        let dataRowIndex = i + 1;
        while (dataRowIndex < templateData.length) {
          const dataRow = templateData[dataRowIndex];
          const dCellA = dataRow[0]?.toString().trim() || '';
          const dCellB = dataRow[1]?.toString().trim() || '';
          
          // Parar si encontramos otra subsección conocida
          if (knownSubsections.some(name => dCellA === name)) {
            break;
          }
          
          // Agregar filas de SUBTOTAL o TOTAL pero NO parar (continuar hasta fila vacía o nueva subsección)
          const isSubtotalRow = dCellA.startsWith('SUBTOTAL') || dCellA.startsWith('TOTAL');
          
          const isEmptyRow = !dCellA && !dCellB && !dataRow[2]?.toString().trim();
          if (isEmptyRow) {
            break;
          }
          
          // Agregar fila de datos si tiene contenido
          if (dCellA || dCellB) {
            const rowData = [];
            for (let col = 0; col < headers.length; col++) {
              rowData.push(dataRow[col]?.toString().trim() || '');
            }
            subsections[subsectionName].rows.push({
              rowNumber: dataRowIndex + 1,
              data: rowData,
              isSubtotal: isSubtotalRow || undefined
            });
          }
          
          dataRowIndex++;
        }
        
        // Saltar al final de esta subsección
        i = dataRowIndex - 1;
      }
    }
    
    return NextResponse.json({
      success: true,
      subsections: subsections,
      subsectionNames: Object.keys(subsections),
      totalSubsections: Object.keys(subsections).length
    });
    
  } catch (error: any) {
    console.error('Error analyzing INFORMACIÓN PRESUPUESTAL:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message
      },
      { status: 500 }
    );
  }
}