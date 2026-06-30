import { getGeminiClient, isGeminiOnline, cleanAndParseJson } from '../services/geminiService';
import { Type } from '@google/genai';
import { readDb } from '../services/dbService';
import { handleInterruptedTaskCreation } from './taskStateHelper';

// Import specialized agents
import { planGoal, PlannerResult } from './planner';
import { scheduleTask, SchedulerResult } from './scheduler';
import { manageTask, TaskAgentResult } from './task';
import { manageCalendar, CalendarAgentResult } from './calendar';
import { manageHabit, HabitAgentResult } from './habit';
import { manageTeam, TeamAgentResult } from './team';
import { converseChat, ChatAgentResult } from './chat';
import { queryMemory } from './memory_agent';

export type AgentType = 'planner' | 'scheduler' | 'task' | 'calendar' | 'habit' | 'team' | 'chat' | 'memory';

export interface RouteResponse {
  agent: AgentType;
  statusMessage: string;
  reply: string;
  actions: { type: string; payload: any }[];
}

/**
 * Router Agent: Analyzes user query and routes/delegates to the appropriate specialized agent.
 */
export async function routeRequest(
  prompt: string,
  referenceLocalTime: string,
  userId: string,
  userName: string,
  conversationHistory: any[] = []
): Promise<RouteResponse> {
  const dbData = readDb();
  if (dbData.aiTaskCreationState) {
    const intercepted = await handleInterruptedTaskCreation(prompt, userId, userName);
    if (intercepted) {
      return intercepted;
    }
  }

  const lowercasePrompt = prompt.toLowerCase().trim();
  let selectedAgent: AgentType = 'chat';
  let statusMessage = 'Formulating executive response...';

  // 1. Classification Phase
  if (isGeminiOnline()) {
    try {
      const ai = getGeminiClient();
      const systemInstruction = `You are the Router Agent of Prodo executive assistant.
Your sole job is to classify the user's prompt into one of these 8 specialized agents:

1. 'planner': Breaking down large goals/projects into multiple sub-tasks. (e.g. "I want to start a new project to study for exams, help me plan it out")
2. 'scheduler': Scheduling specific tasks/sessions, handling relative dates (e.g. "tomorrow", "tonight", "next Monday"), resolving conflicts. (e.g. "schedule study tomorrow at 5pm", "add gym tomorrow morning")
3. 'task': CRUD operations on tasks, marking completion, updating or deleting specific tasks. (e.g. "complete study task", "delete focus task", "make gym recurring")
4. 'calendar': Google Calendar sync settings, manually pushing schedules to calendar. (e.g. "sync all tasks to Google Calendar", "google calendar setup")
5. 'habit': Focus logging, performance stats, streaks, productivity coach report. (e.g. "log a 45 min focus session", "show my streaks", "coaching report")
6. 'team': Team operations, creating a team, joining a team, team member scoreboards. (e.g. "create team Alpha", "join group with code PRODO-XYZ", "show team leaderboard")
7. 'memory': Context query, user preferences, what Prodo remembers about the user. (e.g. "what do you remember about me?", "show my preferences")
8. 'chat': General conversation, greetings, standard productivity coaching questions. (e.g. "hello", "who are you", "give me advice on procrastination")

Return strictly in this JSON format:
{
  "agent": "planner" | "scheduler" | "task" | "calendar" | "habit" | "team" | "chat" | "memory",
  "statusMessage": "A short, descriptive message about what the agent is doing"
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: `Classify this prompt: "${prompt}"`,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              agent: {
                type: Type.STRING,
                enum: ['planner', 'scheduler', 'task', 'calendar', 'habit', 'team', 'chat', 'memory']
              },
              statusMessage: { type: Type.STRING }
            },
            required: ['agent', 'statusMessage']
          }
        }
      });

      const parsed = cleanAndParseJson<any>(response.text || '{}');
      if (parsed.agent) {
        selectedAgent = parsed.agent;
        statusMessage = parsed.statusMessage || statusMessage;
      }
    } catch (err) {
      console.error('Router classification failed, reverting to rule-based fallback:', err);
      selectedAgent = classifyRuleBased(lowercasePrompt);
    }
  } else {
    selectedAgent = classifyRuleBased(lowercasePrompt);
  }

  // Override status message based on final routing
  switch (selectedAgent) {
    case 'planner':
      statusMessage = 'Planner agent decomposing goals and planning task breakdown...';
      break;
    case 'scheduler':
      statusMessage = 'Scheduler agent analyzing slots, relative dates and conflict paths...';
      break;
    case 'task':
      statusMessage = 'Task agent executing CRUD operations and updating task indices...';
      break;
    case 'calendar':
      statusMessage = 'Calendar agent syncing database states with primary Google Calendar...';
      break;
    case 'habit':
      statusMessage = 'Habit agent logging session minutes and tallying streaks...';
      break;
    case 'team':
      statusMessage = 'Team agent joining secure workspace and aligning scoreboards...';
      break;
    case 'memory':
      statusMessage = 'Memory agent retrieving context preferences and logs...';
      break;
    case 'chat':
    default:
      statusMessage = 'Chat agent formulating executive productivity advice...';
      break;
  }

  console.log(`Router: Routing request to [${selectedAgent.toUpperCase()}] Agent. Status: "${statusMessage}"`);

  // 2. Delegation Phase
  let reply = '';
  let actions: any[] = [];

  try {
    switch (selectedAgent) {
      case 'planner': {
        const result = await planGoal(prompt);
        reply = result.reply;
        actions = result.actions;
        break;
      }
      case 'scheduler': {
        const result = await scheduleTask(prompt, referenceLocalTime);
        reply = result.reply;
        actions = result.actions;
        break;
      }
      case 'task': {
        const result = await manageTask(prompt);
        reply = result.reply;
        actions = result.actions;
        break;
      }
      case 'calendar': {
        const result = await manageCalendar(prompt);
        reply = result.reply;
        actions = result.actions;
        break;
      }
      case 'habit': {
        const result = await manageHabit(prompt);
        reply = result.reply;
        actions = result.actions;
        break;
      }
      case 'team': {
        const result = await manageTeam(prompt, userId, userName);
        reply = result.reply;
        actions = result.actions;
        break;
      }
      case 'memory': {
        const result = await queryMemory(prompt);
        reply = result.reply;
        actions = result.actions;
        break;
      }
      case 'chat':
      default: {
        const result = await converseChat(prompt, conversationHistory);
        reply = result.reply;
        actions = result.actions;
        break;
      }
    }
  } catch (error) {
    console.error(`Delegation to agent [${selectedAgent.toUpperCase()}] failed:`, error);
    reply = `[Router Agent] The ${selectedAgent} agent encountered an unexpected error while executing. Let's try rephrasing or using a different command!`;
  }

  return {
    agent: selectedAgent,
    statusMessage,
    reply,
    actions
  };
}

/**
 * Smart rule-based heuristic classifier when offline or Gemini fails.
 */
function classifyRuleBased(text: string): AgentType {
  if (text.includes('plan') || text.includes('break down') || text.includes('goal') || text.includes('decompose')) {
    return 'planner';
  }
  if (text.includes('schedule') || text.includes('allot') || text.includes('calendar') && (text.includes('tomorrow') || text.includes('tonight') || text.includes('monday') || text.includes('morning') || text.includes('afternoon') || text.includes('at'))) {
    return 'scheduler';
  }
  if (text.includes('complete') || text.includes('finish') || text.includes('done') || text.includes('delete task') || text.includes('remove task') || text.includes('recurring')) {
    return 'task';
  }
  if (text.includes('sync calendar') || text.includes('google calendar')) {
    return 'calendar';
  }
  if (text.includes('log focus') || text.includes('focus log') || text.includes('logged a focus') || text.includes('streak') || text.includes('stats') || text.includes('metric') || text.includes('coaching') || text.includes('report') || text.includes('score')) {
    return 'habit';
  }
  if (text.includes('create team') || text.includes('join team') || text.includes('team scoreboard') || text.includes('leaderboard') || text.includes('member')) {
    return 'team';
  }
  if (text.includes('remember') || text.includes('my preference')) {
    return 'memory';
  }
  return 'chat';
}
