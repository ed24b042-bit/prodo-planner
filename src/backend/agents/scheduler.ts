import { getGeminiClient, isGeminiOnline, cleanAndParseJson } from '../services/geminiService';
import { readDb } from '../services/dbService';

export interface SchedulerResult {
  taskTitle: string;
  startTime: string; // ISO timestamp or time string
  duration: number; // in minutes
  priority: 'high' | 'medium' | 'low';
  folder: string;
  explanation: string;
}

export async function scheduleTask(prompt: string, referenceLocalTime: string): Promise<SchedulerResult> {
  const db = readDb();
  const folders = db.folders || ['List1'];
  const refTimeStr = referenceLocalTime || new Date().toISOString();

  // 1. Resolve relative dates & infer times using Gemini if online
  if (!isGeminiOnline()) {
    // Local / Offline rule fallback
    const durMatch = prompt.match(/(\d+)\s*(?:min|minute)/i);
    const duration = durMatch ? Number(durMatch[1]) : 45;
    const priority = prompt.toLowerCase().includes('high') ? 'high' : prompt.toLowerCase().includes('low') ? 'low' : 'medium';
    
    const matchedFolder = folders.find(f => prompt.toLowerCase().includes(f.toLowerCase()));
    const folder = matchedFolder || folders[0] || 'List1';

    return {
      taskTitle: prompt.replace(/schedule|plan/gi, '').trim() || 'Scheduled Task',
      startTime: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes from now
      duration,
      priority,
      folder,
      explanation: '[Offline Scheduler Fallback] Extracted task details locally and estimated a start time in 30 minutes.'
    };
  }

  const ai = getGeminiClient()!;
  try {
    const systemPrompt = `You are an expert Task Scheduler Agent.
Your job is to read a task scheduling request, estimate its required duration in minutes, determine priority ('high' | 'medium' | 'low'), and categorize it into one of these lists: ${JSON.stringify(folders)}.

You should resolve relative times (e.g. "tomorrow at 3pm", "in 2 hours", "next Monday morning") relative to the Reference Local Time: "${refTimeStr}".
If no specific list is requested, map it to the most relevant list, or default to "${folders[0]}".

Return strictly JSON matching this structure:
{
  "taskTitle": "The clean, action-oriented title for the task (without relative time junk)",
  "startTime": "An ISO-8601 string representing the exact scheduled start date and time",
  "duration": duration_in_minutes_as_number,
  "priority": "high" | "medium" | "low",
  "folder": "exact match to one of the available lists",
  "explanation": "A short, pleasant note explaining when it is scheduled"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [systemPrompt, `Schedule Request: "${prompt}"`],
    });

    const parsed = cleanAndParseJson(response.text || '');
    
    // Safety fallback validations
    if (!parsed.taskTitle) parsed.taskTitle = prompt;
    if (!parsed.duration) parsed.duration = 45;
    if (!parsed.priority) parsed.priority = 'medium';
    if (!folders.includes(parsed.folder)) parsed.folder = folders[0];

    return parsed;
  } catch (err) {
    console.error('Scheduler Agent failed:', err);
    return {
      taskTitle: prompt,
      startTime: new Date().toISOString(),
      duration: 45,
      priority: 'medium',
      folder: folders[0],
      explanation: '[Scheduler Agent Warning] Fell back to scheduling now due to model timeout or parsing error.'
    };
  }
}
