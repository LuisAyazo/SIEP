import { NextResponse } from 'next/server';
import { getTemplateStructure } from '@/lib/google-sheets/client';

export async function GET() {
  try {
    const templateData = await getTemplateStructure('FORMATO P&P');
    
    let inGeneralidades = false;
    const generalidadesData: any[] = [];
    let startRow = 0;
    
    for (let i = 0; i < templateData.length; i++) {
      const row = templateData[i];
      const cellA = row[0]?.toString().trim() || '';
      const cellB = row[1]?.toString().trim() || '';
      
      // Detectar inicio de GENERALIDADES
      if (cellA === 'GENERALIDADES' && cellB === 'DESCRIPCIÓN') {
        inGeneralidades = true;
        startRow = i + 1;
        continue;
      }
      
      // Detectar fin de GENERALIDADES (siguiente subsección o sección)
      if (inGeneralidades && cellA && cellB === 'DESCRIPCIÓN' && cellA !== 'GENERALIDADES') {
        break;
      }
      
      // Recopilar campos de GENERALIDADES
      if (inGeneralidades && cellA && cellA !== 'GENERALIDADES') {
        generalidadesData.push({
          row: i + 1,
          label: cellA,
          value: cellB || '',
          cellC: row[2]?.toString().trim() || '',
          cellD: row[3]?.toString().trim() || ''
        });
      }
    }
    
    return NextResponse.json({
      success: true,
      subsection: 'GENERALIDADES',
      startRow,
      totalFields: generalidadesData.length,
      fields: generalidadesData
    });
    
  } catch (error: any) {
    console.error('Error analyzing GENERALIDADES:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}