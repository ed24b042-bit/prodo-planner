import { getGeminiClient, isGeminiOnline, cleanAndParseJson } from '../services/geminiService';
import { readDb, writeDb } from '../services/dbService';
import { Type } from '@google/genai';

export interface TaskAgentResult {
  reply: string;
  actions: { type: string; payload: any }[];
}

/**
 * Task Agent: Handles task manipulation, state updates (completion, progression), and recurring tasks.
 */
export async function manageTask(prompt: string): Promise<TaskAgentResult> {
  const db = readDb();
  const tasks = db.tasks || [];

  if (!isGeminiOnline()) {
    // Offline Task Agent
    const lowercasePrompt = prompt.toLowerCase();
    if (lowercasePrompt.includes('complete') || lowercasePrompt.includes('finish') || lowercasePrompt.includes('done')) {
      // Find the best match
      const matchingTask = tasks.find(t => t.status !== 'completed' && lowercasePrompt.includes(t.title.toLowerCase()));
      if (matchingTask) {
        matchingTask.status = 'completed';
        writeDb(db);
        return {
          reply: `[Task Agent (Offline)] Outstanding! I have marked your task "${matchingTask.title}" as completed!`,
          actions: [{ type: 'update_task', payload: matchingTask }]
        };
      }
    }
    return {
      reply: `[Task Agent (Offline)] I see you are asking about tasks, but I could not match a specific task to update offline. Please make sure the title matches closely!`,
      actions: []
    };
  }

  try {
    const ai = getGeminiClient();
    const systemInstruction = `You are the Task Agent of Prodo productivity assistant.
Your job is to identify what task manipulation the user is requesting (e.g., mark a task as completed, delete a task, change priority/folder, or declare a task as recurring).

Here is a list of existing active tasks in the user's workspace:
${tasks.map(t => `- ID: "${t.id}", Title: "${t.title}", Status: "${t.status}", Priority: "${t.priority}", Folder: "${t.folder}"`).join('\n')}

Analyze the user's instruction and identify:
1. The action: "complete" | "delete" | "update" | "make_recurring" | "none".
2. The target taskId (must match one of the active task IDs above, or be empty).
3. Any specific updates (like priority, title, folder, or recurrence schedule).

Return your response strictly in this JSON format:
{
  "action": "complete" | "delete" | "update" | "make_recurring" | "none",
  "taskId": "task-xxx",
  "explanation": "Brief context explanation of what is being done",
  "updates": {
    "priority": "high" | "medium" | "low" (optional),
    "folder": "Work" | "Personal" etc. (optional),
    "recurrence": "daily" | "weekly" | "none" (optional)
  }
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: `Perform on tasks: "${prompt}"`,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            action: { type: Type.STRING, enum: ['complete', 'delete', 'update', 'make_recurring', 'none'] },
            taskId: { type: Type.STRING },
            explanation: { type: Type.STRING },
            updates: {
              type: Type.OBJECT,
              properties: {
                priority: { type: Type.STRING, enum: ['high', 'medium', 'low'] },
                folder: { type: Type.STRING },
                recurrence: { type: Type.STRING, enum: ['daily', 'weekly', 'none'] }
              }
            }
          },
          required: ['action', 'taskId', 'explanation']
        }
      }
    });

    const parsed = cleanAndParseJson<any>(response.text || '{}');
    const freshDb = readDb();
    const targetTask = freshDb.tasks.find(t => t.id === parsed.taskId);

    if (!targetTask || parsed.action === 'none') {
      return {
        reply: `[Task Agent] ${parsed.explanation || 'I could not find a matching active task to complete or modify. Could you specify the exact task title?'}`,
        actions: []
      };
    }

    const actions: any[] = [];
    let reply = `[Task Agent] ${parsed.explanation}`;

    if (parsed.action === 'complete') {
      targetTask.status = 'completed';
      actions.push({ type: 'update_task', payload: targetTask });
      reply = `[Task Agent] Task marked as completed!\n\n**Completed**: "${targetTask.title}"`;
    } else if (parsed.action === 'delete') {
      freshDb.tasks = freshDb.tasks.filter(t => t.id !== parsed.taskId);
      actions.push({ type: 'delete_task', payload: { id: parsed.taskId } });
      reply = `[Task Agent] Task successfully removed from lists.\n\n**Deleted**: "${targetTask.title}"`;
    } else if (parsed.action === 'update' && parsed.updates) {
      if (parsed.updates.priority) targetTask.priority = parsed.updates.priority;
      if (parsed.updates.folder) targetTask.folder = parsed.updates.folder;
      actions.push({ type: 'update_task', payload: targetTask });
      reply = `[Task Agent] Task updated successfully!\n\n**Updated**: "${targetTask.title}"`;
    } else if (parsed.action === 'make_recurring' && parsed.updates) {
      targetTask.repeat = (parsed.updates.recurrence === 'none' ? 'none' : parsed.updates.recurrence) || 'daily';
      actions.push({ type: 'update_task', payload: targetTask });
      reply = `[Task Agent] Task configured to recur ${targetTask.repeat}!\n\n**Task**: "${targetTask.title}"`;
    }

    writeDb(freshDb);

    return {
      reply,
      actions
    };

  } catch (error) {
    console.error('Task Agent execution failed:', error);
    return {
      reply: `[Task Agent] Sorry, I encountered an issue updating your task. Please try completing it manually using the Board panel.`,
      actions: []
    };
  }
}
