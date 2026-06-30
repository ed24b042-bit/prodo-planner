export interface Task {
  id?: string;
  title: string;
  folder: string; // This corresponds to the user's custom lists
  status: 'todo' | 'inprogress' | 'completed';
  duration: number; // in minutes
  priority: 'high' | 'medium' | 'low';
  assignedTo?: string; // userId of assigned teammate
  assignedToName?: string; // displayName of assigned teammate
  teamId?: string | null; // null for personal task
  createdAt: string;
  description?: string;
  comments?: TaskComment[];
  scheduledDate?: string;
  scheduledTime?: string;
}

export interface TaskComment {
  id: string;
  taskId: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: string;
}

export interface FocusLog {
  id: string;
  taskTitle: string;
  duration: number; // in minutes
  startTime: string;
  tag: string;
}

export interface StreakMetrics {
  streak: number;
  totalMinutes: number;
  tasksCompleted: number;
  lastFocusDate: string | null;
}

export interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  agentStatus?: string;
  actions?: any[];
}

export interface Team {
  id: string;
  name: string;
  code: string;
  creator: string;
  members: string[]; // array of userIds
  memberNames: Record<string, string>; // maps userId -> displayName
  createdAt: string;
}

export interface UserProfile {
  id: string;
  displayName: string;
}
