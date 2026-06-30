import { readDb, writeDb, HabitProfile } from '../services/dbService';
import { getGeminiClient, isGeminiOnline } from '../services/geminiService';

/**
 * Aggregates logs into a structured habit profile (summarizes weekly history).
 */
export async function aggregateWeeklyMemory(): Promise<HabitProfile> {
  const db = readDb();
  const logs = db.focusLogs || [];
  
  const totalFocusedMinutes = logs.reduce((sum, l) => sum + (l.duration || 0), 0);
  const totalFocusedHours = parseFloat((totalFocusedMinutes / 60).toFixed(1));

  // Determine primary location
  const locationsMap: { [key: string]: number } = {};
  logs.forEach(l => {
    if (l.location) {
      locationsMap[l.location] = (locationsMap[l.location] || 0) + 1;
    }
  });
  let primaryLocation = 'home';
  let maxCount = 0;
  for (const loc in locationsMap) {
    if (locationsMap[loc] > maxCount) {
      maxCount = locationsMap[loc];
      primaryLocation = loc;
    }
  }

  // Calculate average distractions rate
  const totalDistractions = logs.reduce((sum, l) => sum + (l.distractions || 0), 0);
  const averageDistractionRate = logs.length > 0 ? parseFloat((totalDistractions / logs.length).toFixed(1)) : 0;

  // Determine overall productivity classification
  const avgScore = db.metrics.averageFocusScore || 0;
  let productivityLevel: 'High' | 'Moderate' | 'Low' = 'Moderate';
  if (avgScore >= 4.2) {
    productivityLevel = 'High';
  } else if (avgScore < 3.0) {
    productivityLevel = 'Low';
  }

  // Generate dynamic habits summary text (using Gemini if online, else smart rules)
  let habitSummary = '';
  if (isGeminiOnline()) {
    try {
      const ai = getGeminiClient();
      const prompt = `Synthesize a brief, 1-sentence analytical long-term memory profile for the user.
Stats:
- Total focused hours: ${totalFocusedHours} hrs
- Primary work location: ${primaryLocation}
- Average distraction count per session: ${averageDistractionRate}
- General productivity rating: ${avgScore}/5
Format: Standard, professional, executive persona.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt
      });
      habitSummary = (response.text || '').trim();
    } catch (err) {
      console.error('Failed to generate summary with Gemini, using rules:', err);
    }
  }

  if (!habitSummary) {
    habitSummary = `The user exhibits a robust focus habit centered in the ${primaryLocation}, maintaining an average rating of ${avgScore}/5 with minimal distractions.`;
  }

  const newProfile: HabitProfile = {
    id: 'habit-' + Date.now(),
    compiledAt: new Date().toISOString(),
    totalFocusedHours,
    primaryLocation,
    averageDistractionRate,
    productivityLevel,
    habitSummary
  };

  db.habitLogs = db.habitLogs || [];
  db.habitLogs.unshift(newProfile); // Add newest profile at the top
  writeDb(db);

  return newProfile;
}

/**
 * Cleanup routine to delete records older than a specific duration (default 30 days) to prevent storage leaks.
 */
export function cleanupAgedHistory(daysToKeep = 30): { tasksCleaned: number; logsCleaned: number } {
  const db = readDb();
  const now = Date.now();
  const limitTime = daysToKeep * 24 * 60 * 60 * 1000;

  const originalTasksLength = db.tasks.length;
  const originalLogsLength = db.focusLogs.length;

  // Cleanup completed tasks older than limit
  db.tasks = db.tasks.filter(task => {
    if (task.status === 'completed' && task.startTime) {
      const taskDate = new Date(task.startTime).getTime();
      if (now - taskDate > limitTime) {
        return false; // delete
      }
    }
    return true;
  });

  // Cleanup old focus logs
  db.focusLogs = db.focusLogs.filter(log => {
    if (log.date) {
      const logDate = new Date(log.date).getTime();
      if (now - logDate > limitTime) {
        return false; // delete
      }
    }
    return true;
  });

  writeDb(db);

  const tasksCleaned = originalTasksLength - db.tasks.length;
  const logsCleaned = originalLogsLength - db.focusLogs.length;

  if (tasksCleaned > 0 || logsCleaned > 0) {
    console.log(`[Memory Agent Garbage Collection] Cleaned ${tasksCleaned} old tasks and ${logsCleaned} aged focus logs.`);
  }

  return { tasksCleaned, logsCleaned };
}

/**
 * Memory Agent user query interface: Returns user preferences, compiled stats and history insights.
 */
export async function queryMemory(prompt: string): Promise<{ reply: string; actions: any[] }> {
  const db = readDb();
  const habitSummary = db.habitLogs && db.habitLogs.length > 0 ? db.habitLogs[0].habitSummary : "No compiled profile yet.";
  const activeStreak = db.metrics?.streak || 0;
  const totalMinutes = db.metrics?.totalFocusMinutes || 0;
  const folders = db.folders || [];

  return {
    reply: `[Memory Agent] Based on your historical workspace logs and compiled context, here is what I remember about you:
- **Compiled Focus Profile**: "${habitSummary}"
- **Streaks & Endurance**: You are on a **${activeStreak}-day** active streak, with **${totalMinutes}** total focus minutes registered.
- **Categorization Preference**: Your active task folders are: ${folders.join(', ')}.

Is there a specific preference or historical record you'd like me to update or examine?`,
    actions: []
  };
}
