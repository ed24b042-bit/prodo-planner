import { getGeminiClient, isGeminiOnline } from '../services/geminiService';
import { readDb, writeDb } from '../services/dbService';
import { insertCalendarEvent } from '../services/calendarService';

export interface CalendarAgentResult {
  reply: string;
  actions: { type: string; payload: any }[];
}

/**
 * Calendar Agent: Connects schedules with Google Calendar API, syncs pending tasks, and displays sync configurations.
 */
export async function manageCalendar(prompt: string): Promise<CalendarAgentResult> {
  const db = readDb();
  const isConnected = !!(db.googleTokens && db.googleTokens.accessToken);

  if (!isConnected) {
    return {
      reply: `[Calendar Agent] Your Google Calendar is not currently connected to this workspace.\n\nTo enable synchronization:\n1. Click the **Connect Calendar** option in the sidebar.\n2. Approve the required permission scopes.\n\nOnce connected, any scheduled sprints with start and end times can automatically sync to your primary Google Calendar!`,
      actions: []
    };
  }

  const lowercasePrompt = prompt.toLowerCase();
  
  if (lowercasePrompt.includes('sync') || lowercasePrompt.includes('push') || lowercasePrompt.includes('allot')) {
    // Sync all tasks with a startTime and endTime that do NOT yet have a calendarEventId
    const unsyncedTasks = db.tasks.filter(t => t.startTime && t.endTime && !t.calendarEventId);

    if (unsyncedTasks.length === 0) {
      return {
        reply: `[Calendar Agent] All tasks on your schedule are already synchronized with Google Calendar! No manual actions needed.`,
        actions: []
      };
    }

    let successCount = 0;
    const actions: any[] = [];

    for (const task of unsyncedTasks) {
      try {
        const syncResponse = await insertCalendarEvent({
          summary: task.title,
          description: `Scheduled via Prodo AI Calendar Sync. Priority: ${task.priority}`,
          start: { dateTime: task.startTime! },
          end: { dateTime: task.endTime! }
        });

        if (syncResponse.success && syncResponse.id) {
          task.calendarEventId = syncResponse.id;
          successCount++;
          actions.push({ type: 'update_task', payload: task });
        }
      } catch (err) {
        console.error(`Calendar Agent failed to sync task ${task.id}:`, err);
      }
    }

    if (successCount > 0) {
      writeDb(db);
      return {
        reply: `[Calendar Agent] Sync complete! Successfully synchronized **${successCount} new tasks** to your primary Google Calendar. They are now fully aligned!`,
        actions
      };
    } else {
      return {
        reply: `[Calendar Agent] I attempted to synchronize ${unsyncedTasks.length} tasks, but Google Calendar API returned an authentication or network error. Please verify your connection status.`,
        actions: []
      };
    }
  }

  // General Calendar status info
  const syncedCount = db.tasks.filter(t => !!t.calendarEventId).length;
  return {
    reply: `[Calendar Agent] Your primary Google Calendar is **active and connected**.\n\n- **Synced Events**: ${syncedCount} items synchronized.\n- **Unsynced Items**: ${db.tasks.filter(t => t.startTime && !t.calendarEventId).length} pending schedule items.\n\n*Action*: Ask me to **"sync tasks"** or **"allot schedule to google"** at any time to manually force a synchronization of your entire workspace scheduler.`,
    actions: []
  };
}
