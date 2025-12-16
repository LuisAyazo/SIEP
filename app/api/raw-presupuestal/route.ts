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
    
    // Extraer 100 filas desde INFORMACIÓN PRESUPUESTAL con todas las columnas
    const rawData = [];
    for (let i = startRow; i < Math.min(startRow + 100, templateData.length); i++) {
      const row = templateData[i];
      const rowData: any = {
        rowNumber: i + 1
      };
      
      // Leer hasta 20 columnas
      for (let col = 0; col < 20; col++) {
        const cellValue = row[col]?.toString().trim() || '';
        if (cellValue) {
          rowData[`col${String.fromCharCode(65 + col)}`] = cellValue;
        }
      }
      
      rawData.push(rowData);
    }
    
    return NextResponse.json({
      success: true,
      startRow: startRow + 1,
      totalRows: rawData.length,
      data: rawData
    });
    
  } catch (error: any) {
    console.error('Error getting raw INFORMACIÓN PRESUPUESTAL:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message 
      },
      { status: 500 }
    );
  }
}