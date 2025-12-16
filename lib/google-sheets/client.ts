import { google } from 'googleapis';

export async function getGoogleSheetsClient() {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    return sheets;
  } catch (error) {
    console.error('[Google Sheets] Error al crear cliente:', error);
    throw error;
  }
}

export async function getTemplateStructure(sheetName: string = 'FICHA TÉCNICA') {
  try {
    const sheets = await getGoogleSheetsClient();
    const templateId = process.env.GOOGLE_SHEETS_TEMPLATE_ID!;

    console.log('[Google Sheets] Leyendo plantilla:', templateId);
    console.log('[Google Sheets] Hoja:', sheetName);

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: templateId,
      range: `'${sheetName}'!A1:Z300`, // Leer hasta 300 filas para cubrir todo el documento
    });

    console.log('[Google Sheets] Datos leídos exitosamente');
    return response.data.values || [];
  } catch (error: any) {
    console.error('[Google Sheets] Error al leer plantilla:', error.message);
    throw error;
  }
}

export async function getSheetMetadata() {
  try {
    const sheets = await getGoogleSheetsClient();
    const templateId = process.env.GOOGLE_SHEETS_TEMPLATE_ID!;

    const response = await sheets.spreadsheets.get({
      spreadsheetId: templateId,
    });

    return response.data;
  } catch (error: any) {
    console.error('[Google Sheets] Error al obtener metadata:', error.message);
    throw error;
  }
}