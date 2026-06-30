import { getGeminiClient, isGeminiOnline, cleanAndParseJson } from '../services/geminiService';
import { readDb } from '../services/dbService';

export type UserIntent = 'schedule_task' | 'log_focus' | 'get_metrics' | 'general_chat';

export interface BrainResult {
  intent: UserIntent;
  confidence: number;
  extractedData?: {
    taskTitle?: string;
    duration?: number;
    priority?: 'high' | 'medium' | 'low';
    folder?: string;
    startTime?: string;
  };
  reply: string;
}

export async function processUserMessage(text: string): Promise<BrainResult> {
  const normalizedText = text.toLowerCase();

  // Simple heuristic checks for offline fallback
  if (!isGeminiOnline()) {
    const db = readDb();
    const userFolders = db.folders || ['List1'];
    const durationMatch = text.match(/(\d+)\s*(?:min|minute)/);
    const duration = durationMatch ? Number(durationMatch[1]) : 45;
    const priority = text.includes('high') ? 'high' : text.includes('low') ? 'low' : 'medium';
    const matchedFolder = userFolders.find(f => normalizedText.includes(f.toLowerCase()));
    const folder = matchedFolder || userFolders[0] || 'List1';

    if (normalizedText.includes('schedule') || normalizedText.includes('plan') || normalizedText.includes('add task')) {
      return {
        intent: 'schedule_task',
        confidence: 0.9,
        extractedData: {
          taskTitle: text.replace(/schedule|plan|add task/gi, '').trim() || 'Unplanned Task',
          duration,
          priority,
          folder
        },
        reply: 'Processing your scheduling/planning request. Let me structure this...'
      };
    }

    if (normalizedText.includes('focus') || normalizedText.includes('log') || normalizedText.includes('timer')) {
      return {
        intent: 'log_focus',
        confidence: 0.8,
        extractedData: {
          taskTitle: text.replace(/focus|log|timer/gi, '').trim() || 'Focus Session',
          duration
        },
        reply: 'Logging your focus session details...'
      };
    }

    if (normalizedText.includes('metric') || normalizedText.includes('streak') || normalizedText.includes('analytics')) {
      return {
        intent: 'get_metrics',
        confidence: 0.8,
        reply: 'Retrieving your metrics and analytics...'
      };
    }

    return {
      intent: 'general_chat',
      confidence: 1.0,
      reply: 'Hello! I am your Team Ledger Planner Assistant. Ask me to schedule tasks, track focus sessions, or coordinate goals!'
    };
  }

  // Gemini is online - use it to understand the request
  const ai = getGeminiClient()!;
  try {
    const db = readDb();
    const userFolders = db.folders || ['List1'];
    const prompt = `You are the brain of a multi-agent digital task board. 
The user is speaking to you. Classify their intent into one of: 'schedule_task', 'log_focus', 'get_metrics', 'general_chat'.
The available folders (task lists) on the board are: ${JSON.stringify(userFolders)}.

Respond strictly in JSON format matching this schema:
{
  "intent": "schedule_task" | "log_focus" | "get_metrics" | "general_chat",
  "confidence": number,
  "extractedData": {
    "taskTitle": "extracted title or blank",
    "duration": estimated_or_extracted_minutes_as_number,
    "priority": "high" | "medium" | "low",
    "folder": "exact match to one of userFolders, default to List1"
  },
  "reply": "Conversational reply acknowledging or clarifying the intent"
}

User input: "${text}"`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const resultText = response.text || '';
    const parsed = cleanAndParseJson(resultText);
    return parsed;
  } catch (err) {
    console.error('Error in brain agent calling Gemini:', err);
    // fallback
    return {
      intent: 'general_chat',
      confidence: 0.5,
      reply: 'I had a temporary connection issue. How can I help you manage your lists and tasks today?'
    };
  }
}
