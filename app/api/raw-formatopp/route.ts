import { NextResponse } from 'next/server';
import { getTemplateStructure } from '@/lib/google-sheets/client';

export async function GET() {
  try {
    const data = await getTemplateStructure('FORMATO P&P');
    
    // Obtener las últimas 5 filas con contenido
    const lastRows = data.slice(-5);
    
    return NextResponse.json({
      success: true,
      totalRows: data.length,
      lastRows,
      // Filas específicas 200-202
      row200: data[199], // índice 199 = fila 200
      row201: data[200],
      row202: data[201],
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}