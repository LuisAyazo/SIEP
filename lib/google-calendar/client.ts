import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

// Configuración de OAuth2
const SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile'
];

/**
 * Crea un cliente OAuth2 para Google Calendar
 */
export function createOAuth2Client() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/google/callback`;

  if (!clientId || !clientSecret) {
    throw new Error('Google OAuth credentials not configured');
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

/**
 * Genera la URL de autorización de Google
 */
export function getAuthUrl(oauth2Client: OAuth2Client, state?: string) {
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    state: state,
    prompt: 'consent', // Fuerza a mostrar el consentimiento para obtener refresh token
  });
}

/**
 * Intercambia el código de autorización por tokens
 */
export async function getTokensFromCode(oauth2Client: OAuth2Client, code: string) {
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

/**
 * Crea un cliente de Google Calendar autenticado
 */
export function createCalendarClient(accessToken: string, refreshToken?: string) {
  const oauth2Client = createOAuth2Client();
  
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  return google.calendar({ version: 'v3', auth: oauth2Client });
}

/**
 * Crea un evento en Google Calendar
 */
export async function createCalendarEvent(
  accessToken: string,
  refreshToken: string | undefined,
  event: {
    summary: string;
    description?: string;
    location?: string;
    start: string; // ISO 8601 format
    end: string; // ISO 8601 format
    attendees?: string[]; // Array de emails
  }
) {
  const calendar = createCalendarClient(accessToken, refreshToken);

  const calendarEvent = {
    summary: event.summary,
    description: event.description,
    location: event.location,
    start: {
      dateTime: event.start,
      timeZone: 'America/Bogota',
    },
    end: {
      dateTime: event.end,
      timeZone: 'America/Bogota',
    },
    attendees: event.attendees?.map(email => ({
      email,
      // Los invitados NO pueden modificar el evento
      optional: false,
      responseStatus: 'needsAction'
    })),
    // Configuración de permisos: SOLO el organizador puede editar
    guestsCanModify: false,
    guestsCanInviteOthers: false, // También restringir invitar a otros
    guestsCanSeeOtherGuests: true,
    // Hacer el evento más restrictivo
    visibility: 'default',
    // Generar automáticamente Google Meet
    conferenceData: {
      createRequest: {
        requestId: `meet-${Date.now()}`,
        conferenceSolutionKey: {
          type: 'hangoutsMeet'
        }
      }
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 24 * 60 }, // 1 día antes
        { method: 'popup', minutes: 30 }, // 30 minutos antes
      ],
    },
  };

  console.log('📅 Creando evento con permisos:', {
    guestsCanModify: calendarEvent.guestsCanModify,
    guestsCanInviteOthers: calendarEvent.guestsCanInviteOthers,
    visibility: calendarEvent.visibility
  });

  const response = await calendar.events.insert({
    calendarId: 'primary',
    requestBody: calendarEvent,
    conferenceDataVersion: 1, // Requerido para crear Google Meet
    sendUpdates: 'all', // Enviar invitaciones a los asistentes
  });

  console.log('✅ Evento creado. Permisos aplicados:', {
    guestsCanModify: response.data.guestsCanModify,
    guestsCanInviteOthers: response.data.guestsCanInviteOthers
  });

  return response.data;
}

/**
 * Actualiza un evento en Google Calendar
 */
export async function updateCalendarEvent(
  accessToken: string,
  refreshToken: string | undefined,
  eventId: string,
  event: {
    summary?: string;
    description?: string;
    location?: string;
    start?: string;
    end?: string;
    attendees?: string[];
  }
) {
  const calendar = createCalendarClient(accessToken, refreshToken);

  const calendarEvent: any = {};
  
  if (event.summary) calendarEvent.summary = event.summary;
  if (event.description) calendarEvent.description = event.description;
  if (event.location) calendarEvent.location = event.location;
  
  if (event.start) {
    calendarEvent.start = {
      dateTime: event.start,
      timeZone: 'America/Bogota',
    };
  }
  
  if (event.end) {
    calendarEvent.end = {
      dateTime: event.end,
      timeZone: 'America/Bogota',
    };
  }
  
  if (event.attendees) {
    calendarEvent.attendees = event.attendees.map(email => ({ email }));
  }

  const response = await calendar.events.patch({
    calendarId: 'primary',
    eventId: eventId,
    requestBody: calendarEvent,
    sendUpdates: 'all',
  });

  return response.data;
}

/**
 * Elimina un evento de Google Calendar
 */
export async function deleteCalendarEvent(
  accessToken: string,
  refreshToken: string | undefined,
  eventId: string
) {
  const calendar = createCalendarClient(accessToken, refreshToken);

  await calendar.events.delete({
    calendarId: 'primary',
    eventId: eventId,
    sendUpdates: 'all',
  });
}
