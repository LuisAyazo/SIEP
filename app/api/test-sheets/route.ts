import { NextResponse } from 'next/server';
import { getTemplateStructure, getSheetMetadata } from '@/lib/google-sheets/client';

export async function GET() {
  try {
    console.log('[Test Sheets] Iniciando prueba de conexión...');
    
    // 1. Obtener metadata del sheet
    console.log('[Test Sheets] Obteniendo metadata...');
    const metadata = await getSheetMetadata();
    
    // 2. Leer datos de la plantilla
    console.log('[Test Sheets] Leyendo datos...');
    const data = await getTemplateStructure();
    
    // 3. Extraer información relevante
    const sheetInfo = {
      title: metadata.properties?.title,
      locale: metadata.properties?.locale,
      timeZone: metadata.properties?.timeZone,
      sheets: metadata.sheets?.map(sheet => ({
        title: sheet.properties?.title,
        index: sheet.properties?.index,
        rowCount: sheet.properties?.gridProperties?.rowCount,
        columnCount: sheet.properties?.gridProperties?.columnCount,
      })),
    };
    
    // 4. Mostrar primeras 20 filas
    const preview = data.slice(0, 20);
    
    // 5. Buscar la fila #10 (índice 9)
    const row10 = data[9];
    const nombreProyecto = row10?.[1]; // Columna B (índice 1)
    
    return NextResponse.json({
      success: true,
      message: '✅ Conexión exitosa con Google Sheets',
      sheetInfo,
      preview,
      row10: {
        label: row10?.[0],
        value: nombreProyecto,
        fullRow: row10,
      },
      stats: {
        totalRows: data.length,
        totalColumns: data[0]?.length || 0,
      },
    });
  } catch (error: any) {
    console.error('[Test Sheets] Error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        details: error.stack,
      },
      { status: 500 }
    );
  }
}