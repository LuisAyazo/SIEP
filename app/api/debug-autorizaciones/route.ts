import { NextResponse } from 'next/server';
import { google } from 'googleapis';

const TEMPLATE_SPREADSHEET_ID = '19OTYnX5KY-ra3Ctw8A0GzE0fR5Nn7hkQAnHqS-M2gFY';

export async function GET() {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    
    // Leer desde la fila 1 hasta la 200 para capturar toda la sección de AUTORIZACIONES
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: TEMPLATE_SPREADSHEET_ID,
      range: 'FORMATO P&P!A1:Z200',
    });

    const rows = response.data.values || [];
    
    // Buscar donde empieza AUTORIZACIONES
    let autorizacionesStart = -1;
    let autorizacionesEnd = -1;
    
    for (let i = 0; i < rows.length; i++) {
      const cellA = rows[i][0]?.toString().trim() || '';
      
      if (cellA === 'AUTORIZACIONES') {
        autorizacionesStart = i;
        console.log(`✅ AUTORIZACIONES encontrado en fila ${i + 1}`);
      }
      
      // Buscar el final (cuando aparece otra sección o se acaban las filas con contenido)
      if (autorizacionesStart !== -1 && autorizacionesEnd === -1) {
        if (i > autorizacionesStart + 1 && cellA && cellA.match(/^[A-Z\s]+$/) && cellA.length > 15) {
          autorizacionesEnd = i - 1;
          console.log(`✅ Fin de AUTORIZACIONES en fila ${i}`);
          break;
        }
      }
    }
    
    if (autorizacionesEnd === -1) {
      autorizacionesEnd = rows.length - 1;
    }
    
    // Extraer solo las filas de AUTORIZACIONES
    const autorizacionesRows = rows.slice(autorizacionesStart, autorizacionesEnd + 1);
    
    console.log('\n=== CONTENIDO DE AUTORIZACIONES ===');
    console.log(`Filas: ${autorizacionesStart + 1} a ${autorizacionesEnd + 1}`);
    console.log(`Total de filas: ${autorizacionesRows.length}`);
    
    const detailedRows = autorizacionesRows.map((row, idx) => {
      const rowNum = autorizacionesStart + idx + 1;
      const cellA = row[0]?.toString().trim() || '';
      const cellB = row[1]?.toString().trim() || '';
      const cellC = row[2]?.toString().trim() || '';
      const cellD = row[3]?.toString().trim() || '';
      
      return {
        fila: rowNum,
        A: cellA,
        B: cellB,
        C: cellC,
        D: cellD,
        esVacio: !cellA && !cellB && !cellC && !cellD,
        longitudA: cellA.length,
      };
    });
    
    console.log('\nDetalle de cada fila:');
    detailedRows.forEach(r => {
      if (!r.esVacio) {
        console.log(`Fila ${r.fila}: A="${r.A}" (${r.longitudA} chars), B="${r.B}", C="${r.C}", D="${r.D}"`);
      }
    });

    return NextResponse.json({
      success: true,
      autorizacionesStart: autorizacionesStart + 1,
      autorizacionesEnd: autorizacionesEnd + 1,
      totalRows: autorizacionesRows.length,
      rows: detailedRows.filter(r => !r.esVacio),
    });

  } catch (error: any) {
    console.error('Error al leer AUTORIZACIONES:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}