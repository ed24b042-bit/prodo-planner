import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

import { readDb, writeDb } from './src/backend/services/dbService.js';
import { processUserMessage } from './src/backend/agents/brain.js';
import { planGoal } from './src/backend/agents/planner.js';
import { scheduleTask } from './src/backend/agents/scheduler.js';
import { handleSavePlannedTasks, handleSaveScheduledTask } from './src/backend/agents/taskStateHelper.js';

const app = express();
const PORT = 3000;

app.use(express.json());

// Helper to generate code
function generateInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `TEAM-${code}`;
}

// ==========================================
// 1. Core Profile / Utilities
// ==========================================
app.get('/api/profile', (_req, res) => {
  // Mock logged-in user profiles
  res.json({
    id: 'user-primary',
    displayName: 'Lead Planner'
  });
});

// ==========================================
// 2. Lists (Folders) CRUD Endpoints
// ==========================================
app.get('/api/folders', (req, res) => {
  const dbData = readDb();
  const { teamId } = req.query;
  
  if (teamId && typeof teamId === 'string') {
    const team = dbData.teams?.find((t: any) => t.id === teamId);
    if (team) {
      if (!team.folders || team.folders.length === 0) {
        team.folders = ['List1'];
        writeDb(dbData);
      }
      res.json(team.folders);
      return;
    }
  }
  
  res.json(dbData.folders || ['List1']);
});

app.put('/api/folders', (req, res) => {
  const dbData = readDb();
  const { folders, teamId } = req.body;
  if (!folders || !Array.isArray(folders)) {
    res.status(400).json({ error: 'Folders array is required' });
    return;
  }
  
  if (teamId) {
    const team = dbData.teams?.find((t: any) => t.id === teamId);
    if (team) {
      team.folders = folders;
      writeDb(dbData);
      res.json({ success: true, folders: team.folders });
      return;
    } else {
      res.status(404).json({ error: 'Team workspace not found' });
      return;
    }
  }

  dbData.folders = folders;
  writeDb(dbData);
  res.json({ success: true, folders: dbData.folders });
});

app.post('/api/folders', (req, res) => {
  const dbData = readDb();
  const { name, teamId } = req.body;
  if (!name || !name.trim()) {
    res.status(400).json({ error: 'Folder/list name is required' });
    return;
  }
  const normalized = name.trim();

  if (teamId) {
    const team = dbData.teams?.find((t: any) => t.id === teamId);
    if (!team) {
      res.status(404).json({ error: 'Team workspace not found' });
      return;
    }
    const currentFolders = team.folders || ['List1'];
    if (currentFolders.map((f: string) => f.toLowerCase()).includes(normalized.toLowerCase())) {
      res.status(400).json({ error: 'Folder/list already exists' });
      return;
    }
    team.folders = [...currentFolders, normalized];
    writeDb(dbData);
    res.status(201).json({ success: true, folders: team.folders });
    return;
  }

  const currentFolders = dbData.folders || ['List1'];
  if (currentFolders.map(f => f.toLowerCase()).includes(normalized.toLowerCase())) {
    res.status(400).json({ error: 'Folder/list already exists' });
    return;
  }
  dbData.folders = [...currentFolders, normalized];
  writeDb(dbData);
  res.status(201).json({ success: true, folders: dbData.folders });
});

app.put('/api/folders/:name', (req, res) => {
  const dbData = readDb();
  const { name } = req.params;
  const { newName, teamId } = req.body;

  if (!newName || !newName.trim()) {
    res.status(400).json({ error: 'New list name is required' });
    return;
  }

  const oldNameNormalized = name.trim();
  const newNameNormalized = newName.trim();

  if (teamId) {
    const team = dbData.teams?.find((t: any) => t.id === teamId);
    if (!team) {
      res.status(404).json({ error: 'Team workspace not found' });
      return;
    }
    const currentFolders = team.folders || ['List1'];
    const index = currentFolders.findIndex((f: string) => f.toLowerCase() === oldNameNormalized.toLowerCase());

    if (index === -1) {
      res.status(404).json({ error: 'List not found' });
      return;
    }

    const isDuplicate = currentFolders.some((f: string, idx: number) => idx !== index && f.toLowerCase() === newNameNormalized.toLowerCase());
    if (isDuplicate) {
      res.status(400).json({ error: 'New list name already exists' });
      return;
    }

    const originalOldName = currentFolders[index];
    currentFolders[index] = newNameNormalized;
    team.folders = currentFolders;

    // Update all team tasks belonging to this renamed folder
    dbData.tasks = (dbData.tasks || []).map((task: any) => {
      if (task.teamId === teamId && task.folder === originalOldName) {
        return { ...task, folder: newNameNormalized };
      }
      return task;
    });

    writeDb(dbData);
    res.json({ success: true, folders: team.folders });
    return;
  }

  const currentFolders = dbData.folders || ['List1'];
  const index = currentFolders.findIndex(f => f.toLowerCase() === oldNameNormalized.toLowerCase());

  if (index === -1) {
    res.status(404).json({ error: 'List not found' });
    return;
  }

  const isDuplicate = currentFolders.some((f, idx) => idx !== index && f.toLowerCase() === newNameNormalized.toLowerCase());
  if (isDuplicate) {
    res.status(400).json({ error: 'New list name already exists' });
    return;
  }

  const originalOldName = currentFolders[index];
  currentFolders[index] = newNameNormalized;
  dbData.folders = currentFolders;

  // Update all tasks belonging to this renamed folder
  dbData.tasks = (dbData.tasks || []).map((task: any) => {
    if (!task.teamId && task.folder === originalOldName) {
      return { ...task, folder: newNameNormalized };
    }
    return task;
  });

  writeDb(dbData);
  res.json({ success: true, folders: dbData.folders });
});

app.delete('/api/folders/:name', (req, res) => {
  const dbData = readDb();
  const { name } = req.params;
  const { teamId } = req.query;
  const folderToDelete = name.trim();

  if (teamId && typeof teamId === 'string') {
    const team = dbData.teams?.find((t: any) => t.id === teamId);
    if (!team) {
      res.status(404).json({ error: 'Team workspace not found' });
      return;
    }
    const currentFolders = team.folders || ['List1'];
    const index = currentFolders.findIndex((f: string) => f.toLowerCase() === folderToDelete.toLowerCase());

    if (index === -1) {
      res.status(404).json({ error: 'List not found' });
      return;
    }

    if (currentFolders.length <= 1) {
      res.status(400).json({ error: 'You must keep at least one list' });
      return;
    }

    const originalFolderName = currentFolders[index];
    team.folders = currentFolders.filter((_: any, idx: number) => idx !== index);

    const fallbackFolder = team.folders[0];
    dbData.tasks = (dbData.tasks || []).map((task: any) => {
      if (task.teamId === teamId && task.folder === originalFolderName) {
        return { ...task, folder: fallbackFolder };
      }
      return task;
    });

    writeDb(dbData);
    res.json({ success: true, folders: team.folders });
    return;
  }

  const currentFolders = dbData.folders || ['List1'];
  const index = currentFolders.findIndex(f => f.toLowerCase() === folderToDelete.toLowerCase());

  if (index === -1) {
    res.status(404).json({ error: 'List not found' });
    return;
  }

  if (currentFolders.length <= 1) {
    res.status(400).json({ error: 'You must keep at least one list' });
    return;
  }

  const originalFolderName = currentFolders[index];
  dbData.folders = currentFolders.filter((_, idx) => idx !== index);

  const fallbackFolder = dbData.folders[0];
  dbData.tasks = (dbData.tasks || []).map((task: any) => {
    if (!task.teamId && task.folder === originalFolderName) {
      return { ...task, folder: fallbackFolder };
    }
    return task;
  });

  writeDb(dbData);
  res.json({ success: true, folders: dbData.folders });
});

// ==========================================
// 3. Tasks CRUD Endpoints
// ==========================================
app.get('/api/tasks', (_req, res) => {
  const dbData = readDb();
  res.json(dbData.tasks || []);
});

app.post('/api/tasks', (req, res) => {
  const dbData = readDb();
  dbData.tasks = dbData.tasks || [];

  const newTask = {
    id: 'task-' + Math.random().toString(36).substring(2, 11),
    status: 'todo',
    createdAt: new Date().toISOString(),
    ...req.body
  };

  dbData.tasks.push(newTask);
  writeDb(dbData);
  res.status(201).json(newTask);
});

app.put('/api/tasks/:id', (req, res) => {
  const dbData = readDb();
  const { id } = req.params;
  dbData.tasks = dbData.tasks || [];

  const index = dbData.tasks.findIndex((t: any) => t.id === id);
  if (index === -1) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }

  dbData.tasks[index] = {
    ...dbData.tasks[index],
    ...req.body
  };

  writeDb(dbData);
  res.json(dbData.tasks[index]);
});

app.delete('/api/tasks/:id', (req, res) => {
  const dbData = readDb();
  const { id } = req.params;
  dbData.tasks = dbData.tasks || [];

  dbData.tasks = dbData.tasks.filter((t: any) => t.id !== id);
  writeDb(dbData);
  res.json({ success: true });
});

// ==========================================
// 4. Focus Logs & Streak Metrics
// ==========================================
app.get('/api/focus-logs', (_req, res) => {
  const dbData = readDb();
  res.json(dbData.focusLogs || []);
});

app.get('/api/metrics', (_req, res) => {
  const dbData = readDb();
  res.json(dbData.streakMetrics || {
    streak: 0,
    totalMinutes: 0,
    tasksCompleted: 0,
    lastFocusDate: null
  });
});

app.post('/api/focus-logs', (req, res) => {
  const dbData = readDb();
  dbData.focusLogs = dbData.focusLogs || [];
  dbData.streakMetrics = dbData.streakMetrics || {
    streak: 0,
    totalMinutes: 0,
    tasksCompleted: 0,
    lastFocusDate: null
  };

  const { taskTitle, duration, tag } = req.body;
  const newLog = {
    id: 'log-' + Math.random().toString(36).substring(2, 11),
    taskTitle: taskTitle || 'Focus Session',
    duration: duration || 25,
    startTime: new Date().toISOString(),
    tag: tag || 'General'
  };

  dbData.focusLogs.push(newLog);

  // Update metrics
  dbData.streakMetrics.totalMinutes += newLog.duration;
  
  // Calculate streaks
  const todayStr = new Date().toISOString().split('T')[0];
  const lastStr = dbData.streakMetrics.lastFocusDate;
  if (!lastStr) {
    dbData.streakMetrics.streak = 1;
  } else {
    const lastDate = new Date(lastStr);
    const todayDate = new Date(todayStr);
    const diffTime = Math.abs(todayDate.getTime() - lastDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      dbData.streakMetrics.streak += 1;
    } else if (diffDays > 1) {
      dbData.streakMetrics.streak = 1;
    }
  }
  dbData.streakMetrics.lastFocusDate = todayStr;

  writeDb(dbData);
  res.status(201).json({ success: true, log: newLog, metrics: dbData.streakMetrics });
});

// ==========================================
// 5. Teams (No mock/simulated users are added!)
// ==========================================
app.get('/api/teams', (_req, res) => {
  const dbData = readDb();
  res.json(dbData.teams || []);
});

app.post('/api/team/create', (req, res) => {
  const dbData = readDb();
  dbData.teams = dbData.teams || [];

  const { name, userId, userName } = req.body;
  if (!name || !name.trim()) {
    res.status(400).json({ error: 'Team name is required' });
    return;
  }

  const code = generateInviteCode();
  const newTeam = {
    id: 'team-' + Math.random().toString(36).substring(2, 11),
    name: name.trim(),
    code,
    creator: userId,
    members: [userId], // strictly only the creating user (no placeholders!)
    memberNames: {
      [userId]: userName
    },
    createdAt: new Date().toISOString()
  };

  dbData.teams.push(newTeam);
  writeDb(dbData);
  res.status(201).json({ success: true, team: newTeam });
});

app.post('/api/team/join', (req, res) => {
  const dbData = readDb();
  dbData.teams = dbData.teams || [];

  const { code, userId, userName } = req.body;
  if (!code || !code.trim()) {
    res.status(400).json({ error: 'Invite code is required' });
    return;
  }

  const team = dbData.teams.find((t: any) => t.code.toUpperCase() === code.trim().toUpperCase());
  if (!team) {
    res.status(404).json({ error: 'Team workspace not found with this code' });
    return;
  }

  if (!team.members.includes(userId)) {
    team.members.push(userId);
    team.memberNames = team.memberNames || {};
    team.memberNames[userId] = userName;
  }

  writeDb(dbData);
  res.json({ success: true, team });
});

app.post('/api/team/leave', (req, res) => {
  const dbData = readDb();
  dbData.teams = dbData.teams || [];

  const { teamId, userId } = req.body;
  const teamIndex = dbData.teams.findIndex((t: any) => t.id === teamId);

  if (teamIndex !== -1) {
    const team = dbData.teams[teamIndex];
    team.members = team.members.filter((mId: string) => mId !== userId);
    if (team.memberNames) {
      delete team.memberNames[userId];
    }
    
    // If no members are left, remove the team workspace
    if (team.members.length === 0) {
      dbData.teams.splice(teamIndex, 1);
    }
    writeDb(dbData);
  }

  res.json({ success: true });
});

// ==========================================
// 6. Conversations / Chat API
// ==========================================
app.get('/api/conversations', (_req, res) => {
  const dbData = readDb();
  res.json(dbData.conversations || []);
});

app.post('/api/chat', async (req, res) => {
  const dbData = readDb();
  dbData.conversations = dbData.conversations || [];

  const { message, userId, userName, teamId } = req.body;
  if (!message || !message.trim()) {
    res.status(400).json({ error: 'Message content is required' });
    return;
  }

  const userMsg = {
    id: 'msg-' + Math.random().toString(36).substring(2, 11),
    sender: 'user',
    text: message,
    timestamp: new Date().toISOString()
  };
  dbData.conversations.push(userMsg);

  try {
    const brainResult = await processUserMessage(message);

    let finalResponse;
    if (brainResult.intent === 'schedule_task' && brainResult.extractedData) {
      const scheduleDetails = await scheduleTask(message, new Date().toISOString());
      finalResponse = handleSaveScheduledTask(
        scheduleDetails.taskTitle,
        scheduleDetails.startTime,
        scheduleDetails.duration,
        scheduleDetails.priority,
        scheduleDetails.folder,
        teamId || null,
        userId,
        userName
      );
    } else if (brainResult.intent === 'log_focus' && brainResult.extractedData) {
      // Create focus log
      const dur = brainResult.extractedData.duration || 25;
      const title = brainResult.extractedData.taskTitle || 'Focus Session';
      
      const newLog = {
        id: 'log-' + Math.random().toString(36).substring(2, 11),
        taskTitle: title,
        duration: dur,
        startTime: new Date().toISOString(),
        tag: 'AI Focus'
      };

      dbData.focusLogs = dbData.focusLogs || [];
      dbData.focusLogs.push(newLog);

      dbData.streakMetrics = dbData.streakMetrics || {
        streak: 0,
        totalMinutes: 0,
        tasksCompleted: 0,
        lastFocusDate: null
      };
      dbData.streakMetrics.totalMinutes += dur;
      dbData.streakMetrics.lastFocusDate = new Date().toISOString().split('T')[0];

      finalResponse = {
        agent: 'focus',
        statusMessage: 'Logging focus...',
        reply: `[Focus Agent] Logged focus session of **${dur} minutes** on **"${title}"**! Keep going!`,
        actions: [{ type: 'REFRESH_METRICS' }]
      };
    } else if (message.toLowerCase().includes('break down') || message.toLowerCase().includes('plan goal') || message.toLowerCase().includes('plan ')) {
      const planDetails = await planGoal(message);
      finalResponse = handleSavePlannedTasks(
        planDetails.goal,
        planDetails.subtasks,
        teamId || null,
        userId,
        userName
      );
    } else {
      finalResponse = {
        agent: 'assistant',
        statusMessage: 'Replying...',
        reply: brainResult.reply,
        actions: []
      };
    }

    const assistantMsg = {
      id: 'msg-' + Math.random().toString(36).substring(2, 11),
      sender: 'assistant',
      text: finalResponse.reply,
      timestamp: new Date().toISOString(),
      agentStatus: finalResponse.statusMessage,
      actions: finalResponse.actions
    };

    dbData.conversations.push(assistantMsg);
    writeDb(dbData);

    res.json({
      messages: [userMsg, assistantMsg],
      actions: finalResponse.actions || []
    });
  } catch (error) {
    console.error('Chat error:', error);
    const errorMsg = {
      id: 'msg-err',
      sender: 'assistant',
      text: 'I encountered an error processing your chat. Let me try again later!',
      timestamp: new Date().toISOString()
    };
    dbData.conversations.push(errorMsg);
    writeDb(dbData);
    res.json({
      messages: [userMsg, errorMsg],
      actions: []
    });
  }
});

// ==========================================
// 7. Vite Setup & Asset Serving
// ==========================================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
