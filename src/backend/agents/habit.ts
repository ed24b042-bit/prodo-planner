import { getGeminiClient, isGeminiOnline, cleanAndParseJson } from '../services/geminiService';
import { readDb, writeDb } from '../services/dbService';
import { generateCoachReport } from './coach';
import { aggregateWeeklyMemory } from './memory_agent';
import { Type } from '@google/genai';

export interface HabitAgentResult {
  reply: string;
  actions: { type: string; payload: any }[];
}

/**
 * Habit Agent: Handles habit creation, focus session logging, metrics compile, and streak updates.
 */
export async function manageHabit(prompt: string): Promise<HabitAgentResult> {
  const lowercasePrompt = prompt.toLowerCase();
  const db = readDb();

  // If the user is asking to show metrics, streaks, progress or coaching report
  if (lowercasePrompt.includes('stat') || lowercasePrompt.includes('metric') || lowercasePrompt.includes('streak') || lowercasePrompt.includes('progress') || lowercasePrompt.includes('report') || lowercasePrompt.includes('coach')) {
    const report = generateCoachReport();
    let reply = `[Habit Agent] Here is your Prodo performance report:\n\n` +
                `• **Productivity Coefficient**: ${report.score}%\n` +
                `• **Current Focus Streak**: ${report.streak} days\n` +
                `• **Total Focused Minutes**: ${report.totalFocusedMinutes} minutes\n` +
                `• **Task Completion Rate**: ${report.completionRate}%\n\n` +
                `*Coaching Guidance*: ${report.advice}`;

    if (db.habitLogs && db.habitLogs.length > 0) {
      reply += `\n\n*Synthesized Insight*: ${db.habitLogs[0].habitSummary}`;
    }

    return {
      reply,
      actions: []
    };
  }

  // If the user wants to compile habits/generate weekly profile
  if (lowercasePrompt.includes('compile') || lowercasePrompt.includes('aggregate') || lowercasePrompt.includes('synthesize')) {
    const profile = await aggregateWeeklyMemory();
    return {
      reply: `[Habit Agent] I have successfully compiled and synthesized your focus history into a new Executive Habit Profile!\n\n` +
             `- **Compiled At**: ${new Date(profile.compiledAt).toLocaleDateString()}\n` +
             `- **Total Logged Hours**: ${profile.totalFocusedHours} hours\n` +
             `- **Primary Focus Location**: ${profile.primaryLocation}\n` +
             `- **Productivity Category**: ${profile.productivityLevel}\n` +
             `- **Summary Profile**: "${profile.habitSummary}"`,
      actions: [{ type: 'compile_habits', payload: profile }]
    };
  }

  // If the user is logging a focus session/study block
  let focusDetails = {
    duration: 45,
    rating: 4,
    distractions: 0,
    location: 'home' as 'home' | 'library' | 'classroom' | 'cafe' | 'office',
    explanation: 'Focus session logged.'
  };

  if (isGeminiOnline()) {
    try {
      const ai = getGeminiClient();
      const systemInstruction = `You are the Habit Agent of Prodo.
Your job is to parse focus log entries from the user's prompt (extracting: duration in minutes, performance rating from 1 to 5, distraction count, and work location).

Locations must match: "home" | "library" | "classroom" | "cafe" | "office".

Return strictly in JSON schema:
{
  "duration": 45,
  "rating": 4,
  "distractions": 0,
  "location": "home" | "library" | "classroom" | "cafe" | "office",
  "explanation": "Brief positive summary of session"
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: `Parse focus log: "${prompt}"`,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              duration: { type: Type.INTEGER },
              rating: { type: Type.INTEGER },
              distractions: { type: Type.INTEGER },
              location: { type: Type.STRING, enum: ['home', 'library', 'classroom', 'cafe', 'office'] },
              explanation: { type: Type.STRING }
            },
            required: ['duration', 'rating', 'distractions', 'location', 'explanation']
          }
        }
      });

      const parsed = cleanAndParseJson<any>(response.text || '{}');
      focusDetails = { ...focusDetails, ...parsed };
    } catch (err) {
      console.error('Habit Agent parsing failed, using offline fallback:', err);
    }
  } else {
    // Offline heuristic parser
    const durationMatch = lowercasePrompt.match(/(\d+)\s*(?:min|minute)/);
    if (durationMatch) {
      focusDetails.duration = Number(durationMatch[1]);
    }
    if (lowercasePrompt.includes('library')) focusDetails.location = 'library';
    if (lowercasePrompt.includes('cafe')) focusDetails.location = 'cafe';
    if (lowercasePrompt.includes('office')) focusDetails.location = 'office';
    if (lowercasePrompt.includes('excellent') || lowercasePrompt.includes('perfect')) focusDetails.rating = 5;
  }

  // Create and save focus log
  const freshDb = readDb();
  const newLog = {
    id: 'log-' + Date.now(),
    date: new Date().toISOString().split('T')[0],
    duration: focusDetails.duration,
    rating: focusDetails.rating,
    distractions: focusDetails.distractions,
    location: focusDetails.location
  };

  freshDb.focusLogs.push(newLog);

  // Recalculate metrics
  const totalFocus = freshDb.focusLogs.reduce((sum: number, l: any) => sum + (l.duration || 0), 0);
  const avgRating = parseFloat((freshDb.focusLogs.reduce((sum: number, l: any) => sum + (l.rating || 0), 0) / freshDb.focusLogs.length).toFixed(2));
  const avgDist = parseFloat((freshDb.focusLogs.reduce((sum: number, l: any) => sum + (l.distractions || 0), 0) / freshDb.focusLogs.length).toFixed(2));
  
  // Calculate streak
  let currentStreak = freshDb.metrics?.streak || 0;
  const todayStr = new Date().toISOString().split('T')[0];
  if (freshDb.metrics?.lastActiveDate !== todayStr) {
    if (freshDb.metrics?.lastActiveDate) {
      const lastActive = new Date(freshDb.metrics.lastActiveDate);
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      if (freshDb.metrics.lastActiveDate === yesterdayStr) {
        currentStreak += 1;
      } else {
        currentStreak = 1;
      }
    } else {
      currentStreak = 1;
    }
  }

  freshDb.metrics = {
    streak: currentStreak,
    totalFocusMinutes: totalFocus,
    averageFocusScore: avgRating,
    averageDistractions: avgDist,
    lastActiveDate: todayStr
  };

  writeDb(freshDb);

  return {
    reply: `[Habit Agent] Success! Focus session logged correctly.\n\n` +
           `- **Duration**: ${newLog.duration} minutes\n` +
           `- **Rating**: ${newLog.rating}/5 stars\n` +
           `- **Location**: ${newLog.location}\n` +
           `- **Distractions**: ${newLog.distractions} interruptions\n\n` +
           `*Streak Alert*: You are on a **${currentStreak}-day** active streak! Keep pushing forward.`,
    actions: [{ type: 'log_focus', payload: newLog }]
  };
}
