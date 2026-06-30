import fs from 'fs';
import path from 'path';

const DB_FILE = path.join(process.cwd(), 'db.json');

export interface DbData {
  tasks: any[];
  focusLogs: any[];
  streakMetrics: {
    streak: number;
    totalMinutes: number;
    tasksCompleted: number;
    lastFocusDate: string | null;
  };
  folders: string[];
  teams: any[];
  conversations: any[];
}

export function readDb(): DbData {
  try {
    if (!fs.existsSync(DB_FILE)) {
      const defaultData: DbData = {
        tasks: [],
        focusLogs: [],
        streakMetrics: {
          streak: 0,
          totalMinutes: 0,
          tasksCompleted: 0,
          lastFocusDate: null
        },
        folders: ['List1'],
        teams: [],
        conversations: []
      };
      fs.writeFileSync(DB_FILE, JSON.stringify(defaultData, null, 2));
      return defaultData;
    }
    const data = fs.readFileSync(DB_FILE, 'utf8');
    const parsed = JSON.parse(data);
    
    // Ensure all critical properties exist
    let updated = false;
    if (!parsed.tasks) { parsed.tasks = []; updated = true; }
    if (!parsed.focusLogs) { parsed.focusLogs = []; updated = true; }
    if (!parsed.streakMetrics) {
      parsed.streakMetrics = {
        streak: 0,
        totalMinutes: 0,
        tasksCompleted: 0,
        lastFocusDate: null
      };
      updated = true;
    }
    if (!parsed.folders || parsed.folders.length === 0) {
      parsed.folders = ['List1'];
      updated = true;
    }
    if (!parsed.teams) { parsed.teams = []; updated = true; }
    if (!parsed.conversations) { parsed.conversations = []; updated = true; }

    if (updated) {
      fs.writeFileSync(DB_FILE, JSON.stringify(parsed, null, 2));
    }
    return parsed;
  } catch (error) {
    console.error('Error reading db.json, returning defaults:', error);
    const fallback: DbData = {
      tasks: [],
      focusLogs: [],
      streakMetrics: {
        streak: 0,
        totalMinutes: 0,
        tasksCompleted: 0,
        lastFocusDate: null
      },
      folders: ['List1'],
      teams: [],
      conversations: []
    };
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(fallback, null, 2));
    } catch (e) {
      console.error('Failed to write fallback db:', e);
    }
    return fallback;
  }
}

export function writeDb(data: DbData): void {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error writing db.json:', error);
  }
}
