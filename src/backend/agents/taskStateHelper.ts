import { readDb, writeDb } from '../services/dbService';
import { Task } from '../../types';

export interface AgentAction {
  type: string;
  payload: any;
}

export interface AgentResponse {
  agent: string;
  statusMessage: string;
  reply: string;
  actions?: AgentAction[];
}

export function handleSavePlannedTasks(
  _goal: string,
  subtasks: Array<{ title: string; duration: number; priority: 'high' | 'medium' | 'low'; folder: string }>,
  teamId: string | null = null,
  userId: string,
  userName: string
): AgentResponse {
  const db = readDb();
  db.tasks = db.tasks || [];

  const createdTasks: Task[] = [];
  subtasks.forEach(st => {
    const task: Task = {
      id: 'task-' + Math.random().toString(36).substring(2, 11),
      title: st.title,
      folder: st.folder,
      status: 'todo',
      duration: st.duration,
      priority: st.priority,
      createdAt: new Date().toISOString(),
      teamId: teamId || null,
    };

    if (teamId) {
      task.assignedTo = userId;
      task.assignedToName = userName;
    }

    db.tasks.push(task);
    createdTasks.push(task);
  });

  writeDb(db);

  const actions: AgentAction[] = [
    { type: 'REFRESH_TASKS', payload: createdTasks }
  ];

  if (!teamId) {
    return {
      agent: 'chat',
      statusMessage: 'Saving tasks...',
      reply: `[Planner Agent] Success! I have saved all **${createdTasks.length}** planned tasks under your personal lists. Let me know if you want to rearrange them!`,
      actions
    };
  } else {
    const matchedTeam = db.teams?.find(t => t.id === teamId);
    const teamName = matchedTeam ? matchedTeam.name : 'your team';
    return {
      agent: 'chat',
      statusMessage: 'Saving team tasks...',
      reply: `[Planner Agent] Success! I have published all **${createdTasks.length}** planned tasks on the shared **"${teamName}"** workspace board. They have been pre-assigned to you!`,
      actions
    };
  }
}

export function handleSaveScheduledTask(
  title: string,
  startTime: string,
  duration: number,
  priority: 'high' | 'medium' | 'low',
  folder: string,
  teamId: string | null,
  userId: string,
  userName: string
): AgentResponse {
  const db = readDb();
  db.tasks = db.tasks || [];

  const task: Task = {
    id: 'task-' + Math.random().toString(36).substring(2, 11),
    title,
    folder,
    status: 'todo',
    duration,
    priority,
    createdAt: new Date().toISOString(),
    teamId: teamId || null,
    description: `Scheduled to start around: ${new Date(startTime).toLocaleString()}`
  };

  if (teamId) {
    task.assignedTo = userId;
    task.assignedToName = userName;
  }

  db.tasks.push(task);
  writeDb(db);

  const actions: AgentAction[] = [
    { type: 'REFRESH_TASKS', payload: [task] }
  ];

  if (!teamId) {
    return {
      agent: 'chat',
      statusMessage: 'Scheduling task...',
      reply: `[Scheduler Agent] Successfully scheduled **"${title}"** as a personal task in your **"${folder}"** list for ${new Date(startTime).toLocaleString()}!`,
      actions
    };
  } else {
    const matchedTeam = db.teams?.find(t => t.id === teamId);
    const teamName = matchedTeam ? matchedTeam.name : 'your team';
    return {
      agent: 'chat',
      statusMessage: 'Scheduling team task...',
      reply: `[Scheduler Agent] Successfully scheduled **"${title}"** on the shared **"${teamName}"** board in the **"${folder}"** list! It is assigned to you.`,
      actions
    };
  }
}
