import { NextRequest, NextResponse } from 'next/server';
import { validateExcelAgainstTemplate, generateValidationReport, analyzeTemplateStructure } from '@/lib/google-sheets/validator';

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

    console.log('[Validate Excel] Archivo recibido:', file.name, file.size, 'bytes');

    // Convertir a buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Validar
    console.log('[Validate Excel] Iniciando validación...');
    const result = await validateExcelAgainstTemplate(buffer);

    // Generar reporte
    const report = generateValidationReport(result);

    console.log('[Validate Excel] Validación completada');
    console.log('[Validate Excel] Válido:', result.valid);
    console.log('[Validate Excel] Errores:', result.errors.length);
    console.log('[Validate Excel] Advertencias:', result.warnings.length);

    return NextResponse.json({
      ...result,
      report,
    });
  } catch (error: any) {
    console.error('[Validate Excel] Error:', error);
    return NextResponse.json(
      { 
        error: error.message,
        stack: error.stack,
      },
      { status: 500 }
    );
  }
}

// Endpoint para obtener solo la estructura de la plantilla
export async function GET() {
  try {
    console.log('[Validate Excel] Obteniendo estructura de plantilla...');
    const structure = await analyzeTemplateStructure();

    // Calcular estadísticas para FICHA TÉCNICA
    const fichaTecnicaSummary = {
      total: structure.fichatecnica.length,
      sections: structure.fichatecnica.filter(el => el.type === 'section').length,
      fields: structure.fichatecnica.filter(el => el.type === 'field').length,
      requiredFields: structure.fichatecnica.filter(el => el.type === 'field' && el.required).length,
      headers: structure.fichatecnica.filter(el => el.type === 'header').length,
      empty: structure.fichatecnica.filter(el => el.type === 'empty').length,
    };

    // Calcular estadísticas para FORMATO P&P
    const formatoPPSummary = {
      total: structure.formatopp.length,
      sections: structure.formatopp.filter(el => el.type === 'section').length,
      fields: structure.formatopp.filter(el => el.type === 'field').length,
      requiredFields: structure.formatopp.filter(el => el.type === 'field' && el.required).length,
      headers: structure.formatopp.filter(el => el.type === 'header').length,
      empty: structure.formatopp.filter(el => el.type === 'empty').length,
    };

    // Estadísticas combinadas
    const combinedSummary = {
      total: fichaTecnicaSummary.total + formatoPPSummary.total,
      sections: fichaTecnicaSummary.sections + formatoPPSummary.sections,
      fields: fichaTecnicaSummary.fields + formatoPPSummary.fields,
      requiredFields: fichaTecnicaSummary.requiredFields + formatoPPSummary.requiredFields,
      headers: fichaTecnicaSummary.headers + formatoPPSummary.headers,
      empty: fichaTecnicaSummary.empty + formatoPPSummary.empty,
    };

    return NextResponse.json({
      success: true,
      structure,
      summary: combinedSummary,
      fichaTecnicaSummary,
      formatoPPSummary,
    });
  } catch (error: any) {
    console.error('[Validate Excel] Error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}