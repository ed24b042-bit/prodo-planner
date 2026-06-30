import { getGeminiClient, isGeminiOnline, cleanAndParseJson } from '../services/geminiService';
import { readDb } from '../services/dbService';

export interface PlannedSubTask {
  title: string;
  duration: number; // in minutes
  priority: 'high' | 'medium' | 'low';
  folder: string;
}

export interface PlannerResult {
  goal: string;
  subtasks: PlannedSubTask[];
  reply: string;
}

export async function planGoal(prompt: string): Promise<PlannerResult> {
  const db = readDb();
  const folders = db.folders || ['List1'];

  if (!isGeminiOnline()) {
    // Offline Planner fallback
    const offlineTasks: PlannedSubTask[] = [
      { title: `Initialize: ${prompt.slice(0, 30)}`, duration: 30, priority: 'high', folder: folders[0] || 'List1' },
      { title: `Research & Outline: ${prompt.slice(0, 30)}`, duration: 45, priority: 'medium', folder: folders[0] || 'List1' },
      { title: `Execute key components of project`, duration: 60, priority: 'high', folder: folders[0] || 'List1' },
      { title: `Review and finalize deliverables`, duration: 30, priority: 'low', folder: folders[0] || 'List1' }
    ];

    return {
      goal: prompt,
      subtasks: offlineTasks,
      reply: `[Offline Planner Agent] Created a standard structured 4-step execution track for your goal **"${prompt}"**. I've populated them under the **${folders[0]}** list.`
    };
  }

  const ai = getGeminiClient()!;
  try {
    const systemPrompt = `You are a professional Project Planner Agent.
Your job is to analyze a user's large goal or project, break it down into a logical sequence of 3 to 5 discrete sub-tasks, estimate reasonable durations (in minutes), select a priority, and match it to one of these available lists: ${folders.join(', ')}.

Return strictly JSON matching this structure:
{
  "goal": "The simplified main project goal",
  "subtasks": [
    {
      "title": "Clear action-oriented sub-task title",
      "duration": duration_in_minutes_as_number,
      "priority": "high" | "medium" | "low",
      "folder": "exact match to one of the available lists"
    }
  ],
  "reply": "A brief explanation of how you structured this breakdown"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [systemPrompt, `User project goal: "${prompt}"`],
    });

    const parsed = cleanAndParseJson(response.text || '');
    
    // Ensure folders are valid
    parsed.subtasks = parsed.subtasks.map((st: any) => ({
      ...st,
      folder: folders.includes(st.folder) ? st.folder : folders[0]
    }));

    return parsed;
  } catch (err) {
    console.error('Planner Agent failed:', err);
    return {
      goal: prompt,
      subtasks: [
        { title: `Start work on: ${prompt}`, duration: 60, priority: 'high', folder: folders[0] }
      ],
      reply: `[Planner Agent Warning] I encountered an error while consulting the AI models. Created a single focus task on your primary board list instead.`
    };
  }
}
