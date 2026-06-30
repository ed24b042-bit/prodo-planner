import { readDb } from './dbService';

export interface CalendarEvent {
  summary: string;
  description?: string;
  start: {
    dateTime: string; // ISO format
    timeZone?: string;
  };
  end: {
    dateTime: string; // ISO format
    timeZone?: string;
  };
}

/**
 * Gets the current stored Google Access Token if available.
 */
function getStoredToken(): string | null {
  const db = readDb();
  if (db.googleTokens && db.googleTokens.accessToken) {
    // Basic expiry verification (if we have expiry timestamp)
    if (db.googleTokens.expiry && Date.now() > db.googleTokens.expiry) {
      console.warn('Google Calendar Access Token has expired.');
      return null;
    }
    return db.googleTokens.accessToken;
  }
  return null;
}

/**
 * Creates a calendar event on Google Calendar if authenticated.
 */
export async function insertCalendarEvent(event: CalendarEvent): Promise<{ success: boolean; id?: string; error?: string }> {
  const token = getStoredToken();
  if (!token) {
    console.log('Skipping real Calendar sync: No active Google OAuth session.');
    return { success: false, error: 'OAuth required' };
  }

  try {
    const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Google Calendar event creation failed:', errorData);
      return { success: false, error: errorData.error?.message || 'API Error' };
    }

    const createdEvent = await response.json();
    return { success: true, id: createdEvent.id };
  } catch (error) {
    console.error('Failed to communicate with Google Calendar:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Updates an event on Google Calendar.
 */
export async function updateCalendarEvent(eventId: string, event: Partial<CalendarEvent>): Promise<boolean> {
  const token = getStoredToken();
  if (!token) return false;

  try {
    const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    });

    return response.ok;
  } catch (error) {
    console.error('Failed to update Google Calendar event:', error);
    return false;
  }
}

/**
 * Deletes an event on Google Calendar.
 */
export async function deleteCalendarEvent(eventId: string): Promise<boolean> {
  const token = getStoredToken();
  if (!token) return false;

  try {
    const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    return response.ok;
  } catch (error) {
    console.error('Failed to delete Google Calendar event:', error);
    return false;
  }
}
