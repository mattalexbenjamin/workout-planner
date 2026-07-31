// APEX Google Calendar Integration Service

import { ATHLETIC_WORKOUTS } from './workouts-catalog';

/**
 * Safely resolve target Google Calendar ID (local selection > profile > primary).
 */
export function getSavedCalendarId(profile) {
  if (typeof window !== 'undefined') {
    const local = localStorage.getItem('apex_selected_calendar_id');
    if (local && local !== 'primary') return local;
  }
  if (profile?.selected_calendar_id && profile.selected_calendar_id !== 'primary') {
    return profile.selected_calendar_id;
  }
  if (typeof window !== 'undefined') {
    const localFallback = localStorage.getItem('apex_selected_calendar_id');
    if (localFallback) return localFallback;
  }
  return profile?.selected_calendar_id || 'primary';
}

/**
 * Fetch the list of calendars accessible by the user.
 */
export async function fetchUserCalendars(accessToken) {
  if (!accessToken) return [];
  try {
    const res = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      console.warn('Failed to fetch user calendars:', await res.text());
      return [];
    }

    const data = await res.json();
    return (data.items || []).map((cal) => ({
      id: cal.id,
      summary: cal.summary || 'Untitled Calendar',
      primary: cal.primary || false,
      backgroundColor: cal.backgroundColor || '#fbbf24',
    }));
  } catch (err) {
    console.error('Error in fetchUserCalendars:', err);
    return [];
  }
}

/**
 * Fetch events for a specific calendar between timeMin and timeMax (ISO strings).
 */
export async function fetchCalendarEvents(accessToken, calendarId = 'primary', timeMin, timeMax) {
  if (!accessToken) return [];
  try {
    const params = new URLSearchParams({
      singleEvents: 'true',
      orderBy: 'startTime',
    });
    if (timeMin) params.append('timeMin', timeMin);
    if (timeMax) params.append('timeMax', timeMax);

    const targetCal = encodeURIComponent(calendarId || 'primary');
    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${targetCal}/events?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!res.ok) {
      console.warn('Failed to fetch calendar events:', await res.text());
      return [];
    }

    const data = await res.json();
    return (data.items || []).map((evt) => {
      const startDate = evt.start?.date || (evt.start?.dateTime ? evt.start.dateTime.split('T')[0] : '');
      const inferred = inferWorkoutFromTitle(evt.summary || '', evt.description || '');

      let calculatedDuration = inferred.duration;
      if (evt.start?.dateTime && evt.end?.dateTime) {
        const startMs = new Date(evt.start.dateTime).getTime();
        const endMs = new Date(evt.end.dateTime).getTime();
        const diffMins = Math.round((endMs - startMs) / (1000 * 60));
        if (diffMins > 0) {
          calculatedDuration = diffMins;
        }
      } else if (evt.start?.date && !evt.start?.dateTime) {
        calculatedDuration = 60;
      }

      return {
        id: `gcal_${evt.id}`,
        gcalId: evt.id,
        isGcal: true,
        summary: evt.summary || 'Scheduled Event',
        workout_name: evt.summary || 'Google Calendar Workout',
        date: startDate,
        startDateTime: evt.start?.dateTime,
        endDateTime: evt.end?.dateTime,
        category: inferred.category,
        exercises: inferred.exercises,
        duration: calculatedDuration,
        notes: evt.description || '',
        htmlLink: evt.htmlLink,
      };
    });
  } catch (err) {
    console.error('Error in fetchCalendarEvents:', err);
    return [];
  }
}

/**
 * Create a new event on the user's selected Google Calendar.
 */
export async function createGoogleCalendarEvent(accessToken, calendarId = 'primary', workout) {
  if (!accessToken) {
    console.warn('No Google access token available to create calendar event.');
    return null;
  }

  try {
    const targetCal = encodeURIComponent(calendarId || 'primary');

    // Build event description with sets & reps breakdown
    let descriptionText = `APEX Summer '26 Workout Log\nCategory: ${workout.category || 'General'}\nDuration: ${workout.duration || 45} mins\n\n`;

    if (workout.exercises && workout.exercises.length > 0) {
      descriptionText += `--- Prescribed Exercises ---\n`;
      workout.exercises.forEach((ex, idx) => {
        descriptionText += `${idx + 1}. ${ex.name}: ${ex.sets} sets x ${ex.reps}`;
        if (ex.notes) descriptionText += ` (${ex.notes})`;
        descriptionText += `\n`;
      });
    }

    if (workout.notes) {
      descriptionText += `\nNotes: ${workout.notes}`;
    }

    const dateStr = workout.date || new Date().toISOString().split('T')[0];
    const durationMins = Number(workout.duration) || 45;
    const startDateObj = new Date(`${dateStr}T09:00:00Z`);
    const endDateObj = new Date(startDateObj.getTime() + durationMins * 60 * 1000);
    const startTime = startDateObj.toISOString();
    const endTime = endDateObj.toISOString();

    const eventBody = {
      summary: `💪 ${workout.workout_name || workout.name || 'APEX Workout'}`,
      description: descriptionText,
      start: {
        dateTime: startTime,
        timeZone: 'UTC',
      },
      end: {
        dateTime: endTime,
        timeZone: 'UTC',
      },
    };

    const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${targetCal}/events`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventBody),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('Failed to create Google Calendar event:', errText);
      return null;
    }

    const createdEvent = await res.json();
    console.log('Successfully created Google Calendar event:', createdEvent.id);
    return createdEvent;
  } catch (err) {
    console.error('Error in createGoogleCalendarEvent:', err);
    return null;
  }
}

/**
 * Delete an event from the user's selected Google Calendar.
 */
export async function deleteGoogleCalendarEvent(accessToken, calendarId = 'primary', gcalEventId) {
  if (!accessToken || !gcalEventId) return false;
  try {
    const targetCal = encodeURIComponent(calendarId || 'primary');
    const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${targetCal}/events/${encodeURIComponent(gcalEventId)}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok && res.status !== 204 && res.status !== 410) {
      console.warn('Failed to delete Google Calendar event:', await res.text());
      return false;
    }
    return true;
  } catch (err) {
    console.error('Error in deleteGoogleCalendarEvent:', err);
    return false;
  }
}

/**
 * Patch the duration of a Google Calendar event.
 */
export async function updateGoogleCalendarEventDuration(accessToken, calendarId = 'primary', gcalEventId, newDurationMinutes, existingStartDateTime, existingDate) {
  if (!accessToken || !gcalEventId) {
    console.warn('No access token or event ID provided to update Google Calendar duration');
    return false;
  }

  try {
    const targetCal = encodeURIComponent(calendarId || 'primary');

    // Calculate new end time based on start time or default start time on that date
    let startIso = existingStartDateTime;
    if (!startIso) {
      const dateStr = existingDate || new Date().toISOString().split('T')[0];
      startIso = `${dateStr}T09:00:00Z`;
    }

    const startDateObj = new Date(startIso);
    const endDateObj = new Date(startDateObj.getTime() + newDurationMinutes * 60 * 1000);

    const patchBody = {
      start: {
        dateTime: startDateObj.toISOString(),
        timeZone: 'UTC'
      },
      end: {
        dateTime: endDateObj.toISOString(),
        timeZone: 'UTC'
      }
    };

    const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${targetCal}/events/${encodeURIComponent(gcalEventId)}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(patchBody),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('Failed to update Google Calendar event duration:', errText);
      return false;
    }

    const updatedEvt = await res.json();
    console.log('Successfully updated Google Calendar event duration:', updatedEvt.id);
    return true;
  } catch (err) {
    console.error('Error in updateGoogleCalendarEventDuration:', err);
    return false;
  }
}

/**
 * Infer workout category from Google Calendar event title & description (returns empty exercises array).
 */
export function inferWorkoutFromTitle(title = '', description = '') {
  const text = `${title} ${description}`.toLowerCase();

  let category = 'other';
  let duration = 45;

  if (text.includes('leg') || text.includes('squat') || text.includes('bench') || text.includes('chest') || text.includes('lift') || text.includes('gym') || text.includes('upper') || text.includes('lower') || text.includes('workout')) {
    category = 'weightlifting';
    duration = 60;
  } else if (text.includes('run') || text.includes('sprint') || text.includes('cardio') || text.includes('interval') || text.includes('jog')) {
    category = 'running';
    duration = 45;
  } else if (text.includes('volleyball') || text.includes('spike') || text.includes('sand')) {
    category = 'volleyball';
    duration = 90;
  } else if (text.includes('football') || text.includes('agility') || text.includes('route') || text.includes('flag')) {
    category = 'flag_football';
    duration = 90;
  } else if (text.includes('recovery') || text.includes('mobility') || text.includes('yoga') || text.includes('stretch')) {
    category = 'recovery';
    duration = 30;
  }

  // Pure category inference with empty exercises array (no fake sets/reps injected)
  return {
    category,
    duration,
    exercises: [],
  };
}
