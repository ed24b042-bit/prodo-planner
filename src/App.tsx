import { useState, useEffect } from 'react';
import { 
  FolderKanban, 
  Calendar as CalendarIcon, 
  Users, 
  Settings as SettingsIcon, 
  Flame, 
  Clock, 
  CheckSquare, 
  ChevronRight,
  LayoutDashboard,
  Brain
} from 'lucide-react';

import { Task, FocusLog, StreakMetrics, Message, Team, UserProfile } from './types';
import TaskPanel from './components/TaskPanel';
import TeamTaskPanel from './components/TeamTaskPanel';
import HabitLogger from './components/HabitLogger';
import CalendarView from './components/CalendarView';
import ChatInterface from './components/ChatInterface';
import Settings from './components/Settings';

export default function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'tasks' | 'calendar' | 'analytics' | 'collaboration' | 'settings'>('home');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [folders, setFolders] = useState<string[]>(['List1']);
  const [focusLogs, setFocusLogs] = useState<FocusLog[]>([]);
  const [metrics, setMetrics] = useState<StreakMetrics>({
    streak: 0,
    totalMinutes: 0,
    tasksCompleted: 0,
    lastFocusDate: null
  });
  const [messages, setMessages] = useState<Message[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile>({
    id: 'user-primary',
    displayName: 'Lead Planner'
  });
  const [userTeams, setUserTeams] = useState<Team[]>([]);
  const [activeTeam, setActiveTeam] = useState<Team | null>(null);
  const [activeTeamFolders, setActiveTeamFolders] = useState<string[]>(['List1']);

  // Fetch team folders when active team changes
  useEffect(() => {
    if (activeTeam) {
      fetch(`/api/folders?teamId=${activeTeam.id}`)
        .then(res => res.ok ? res.json() : ['List1'])
        .then(data => {
          if (Array.isArray(data)) {
            setActiveTeamFolders(data);
          } else {
            setActiveTeamFolders(['List1']);
          }
        })
        .catch(() => setActiveTeamFolders(['List1']));
    } else {
      setActiveTeamFolders(['List1']);
    }
  }, [activeTeam]);

  // Loaders
  const [isLoading, setIsLoading] = useState(true);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [agentStatus, setAgentStatus] = useState('');

  // Initial load
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      const foldersRes = await fetch('/api/folders');
      if (foldersRes.ok) setFolders(await foldersRes.json());

      const tasksRes = await fetch('/api/tasks');
      if (tasksRes.ok) setTasks(await tasksRes.json());

      const logsRes = await fetch('/api/focus-logs');
      if (logsRes.ok) setFocusLogs(await logsRes.json());

      const metricsRes = await fetch('/api/metrics');
      if (metricsRes.ok) setMetrics(await metricsRes.json());

      const teamsRes = await fetch('/api/teams');
      if (teamsRes.ok) setUserTeams(await teamsRes.json());

      const chatRes = await fetch('/api/conversations');
      if (chatRes.ok) setMessages(await chatRes.json());

      const profileRes = await fetch('/api/profile');
      if (profileRes.ok) setUserProfile(await profileRes.json());

    } catch (error) {
      console.error('Error loading backend data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Reorder Folders
  const handleReorderFolders = async (newFolders: string[], teamId?: string | null): Promise<boolean> => {
    try {
      const response = await fetch('/api/folders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folders: newFolders, teamId }),
      });
      if (response.ok) {
        const data = await response.json();
        if (teamId) {
          setActiveTeamFolders(data.folders);
          setUserTeams(prev => prev.map(t => t.id === teamId ? { ...t, folders: data.folders } : t));
        } else {
          setFolders(data.folders);
        }
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error reordering lists:', err);
      return false;
    }
  };

  // CRUD Task Handlers
  const handleAddTask = async (taskDetails: any) => {
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskDetails)
      });
      if (response.ok) {
        const added = await response.json();
        setTasks(prev => [...prev, added]);
      }
    } catch (error) {
      console.error('Failed to add task:', error);
    }
  };

  const handleUpdateTask = async (id: string, updates: any) => {
    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (response.ok) {
        const updated = await response.json();
        setTasks(prev => prev.map(t => t.id === id ? updated : t));
      }
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        setTasks(prev => prev.filter(t => t.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  // List (Folder) Handlers
  const handleAddFolder = async (name: string, teamId?: string | null) => {
    try {
      const response = await fetch('/api/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, teamId })
      });
      if (response.ok) {
        const data = await response.json();
        if (teamId) {
          setActiveTeamFolders(data.folders);
          setUserTeams(prev => prev.map(t => t.id === teamId ? { ...t, folders: data.folders } : t));
        } else {
          setFolders(data.folders);
        }
      }
    } catch (error) {
      console.error('Failed to add list:', error);
    }
  };

  const handleRenameFolder = async (oldName: string, newName: string, teamId?: string | null) => {
    try {
      const response = await fetch(`/api/folders/${encodeURIComponent(oldName)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newName, teamId })
      });
      if (response.ok) {
        const data = await response.json();
        if (teamId) {
          setActiveTeamFolders(data.folders);
          setUserTeams(prev => prev.map(t => t.id === teamId ? { ...t, folders: data.folders } : t));
        } else {
          setFolders(data.folders);
        }
        // Refresh tasks to reflect renamed folder
        const tasksRes = await fetch('/api/tasks');
        if (tasksRes.ok) setTasks(await tasksRes.json());
      }
    } catch (error) {
      console.error('Failed to rename list:', error);
    }
  };

  const handleDeleteFolder = async (name: string, teamId?: string | null) => {
    try {
      const url = `/api/folders/${encodeURIComponent(name)}${teamId ? `?teamId=${teamId}` : ''}`;
      const response = await fetch(url, {
        method: 'DELETE'
      });
      if (response.ok) {
        const data = await response.json();
        if (teamId) {
          setActiveTeamFolders(data.folders);
          setUserTeams(prev => prev.map(t => t.id === teamId ? { ...t, folders: data.folders } : t));
        } else {
          setFolders(data.folders);
        }
        // Refresh tasks
        const tasksRes = await fetch('/api/tasks');
        if (tasksRes.ok) setTasks(await tasksRes.json());
      }
    } catch (error) {
      console.error('Failed to delete list:', error);
    }
  };

  // Focus Tracker Handler
  const handleLogFocus = async (taskTitle: string, duration: number, tag: string) => {
    try {
      const response = await fetch('/api/focus-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskTitle, duration, tag })
      });
      if (response.ok) {
        const data = await response.json();
        setFocusLogs(prev => [...prev, data.log]);
        setMetrics(data.metrics);
      }
    } catch (error) {
      console.error('Failed to log focus:', error);
    }
  };

  // Team Coordination Handlers
  const handleCreateTeam = async (name: string) => {
    try {
      const response = await fetch('/api/team/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          userId: userProfile.id,
          userName: userProfile.displayName
        })
      });
      if (response.ok) {
        const data = await response.json();
        setUserTeams(prev => [...prev, data.team]);
        setActiveTeam(data.team);
      }
    } catch (error) {
      console.error('Failed to create team:', error);
    }
  };

  const handleJoinTeam = async (code: string) => {
    try {
      const response = await fetch('/api/team/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          userId: userProfile.id,
          userName: userProfile.displayName
        })
      });
      if (response.ok) {
        const data = await response.json();
        setUserTeams(prev => {
          const exists = prev.some(t => t.id === data.team.id);
          if (exists) return prev.map(t => t.id === data.team.id ? data.team : t);
          return [...prev, data.team];
        });
        setActiveTeam(data.team);
      } else {
        const errData = await response.json();
        alert(errData.error || 'Failed to join team workspace');
      }
    } catch (error) {
      console.error('Failed to join team:', error);
    }
  };

  const handleLeaveTeam = async (teamId: string) => {
    try {
      const response = await fetch('/api/team/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamId,
          userId: userProfile.id
        })
      });
      if (response.ok) {
        setUserTeams(prev => prev.filter(t => t.id !== teamId));
        if (activeTeam?.id === teamId) {
          setActiveTeam(null);
        }
      }
    } catch (error) {
      console.error('Failed to leave team:', error);
    }
  };

  // Chat/Assistant Handler
  const handleSendMessage = async (text: string) => {
    try {
      setIsChatLoading(true);
      setAgentStatus('Orchestrating agents...');

      // Optimistic user message update
      const userMsg: Message = {
        id: 'msg-temp-' + Math.random(),
        sender: 'user',
        text,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, userMsg]);

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          userId: userProfile.id,
          userName: userProfile.displayName,
          teamId: activeTeam ? activeTeam.id : null
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Remove temp and update
        setMessages(prev => {
          const filtered = prev.filter(m => !m.id.startsWith('msg-temp-'));
          return [...filtered, ...data.messages];
        });

        // Trigger action refresh if needed
        if (data.actions && data.actions.length > 0) {
          data.actions.forEach((act: any) => {
            if (act.type === 'REFRESH_TASKS') {
              fetch('/api/tasks')
                .then(r => r.json())
                .then(t => setTasks(t));
            }
            if (act.type === 'REFRESH_METRICS') {
              fetch('/api/metrics')
                .then(r => r.json())
                .then(m => setMetrics(m));
              fetch('/api/focus-logs')
                .then(r => r.json())
                .then(fl => setFocusLogs(fl));
            }
          });
        }
      }
    } catch (error) {
      console.error('Failed to process chat:', error);
    } finally {
      setIsChatLoading(false);
      setAgentStatus('');
    }
  };

  // Profile Identity handler
  const handleUpdateProfile = async (updates: Partial<UserProfile>) => {
    const updated = { ...userProfile, ...updates };
    setUserProfile(updated);
  };

  const personalTasksCount = tasks.filter(t => !t.teamId && t.status !== 'completed').length;
  const activeTeamTasksCount = activeTeam 
    ? tasks.filter(t => t.teamId === activeTeam.id && t.status !== 'completed').length
    : 0;

  return (
    <div id="app-root" className="min-h-screen bg-[#1E2024] text-[#ECE0D2] flex flex-col font-sans">
      
      {/* Header bar */}
      <header className="border-b border-[#33353B] bg-[#25272B] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-[#ECE0D2] text-[#1E2024] flex items-center justify-center font-bold text-lg select-none">
            L
          </div>
          <div>
            <h1 className="text-base font-black tracking-tight uppercase">Ledger Planner</h1>
            <span className="text-[9px] font-mono text-[#9E9CA3] uppercase tracking-widest block">Team Workspace Sync</span>
          </div>
        </div>

        {/* User Profile Info */}
        <div className="flex items-center space-x-3">
          <div className="flex flex-col text-right">
            <span className="text-xs font-bold text-[#ECE0D2]">{userProfile.displayName}</span>
            <span className="text-[9px] font-mono text-[#9E9CA3] uppercase tracking-widest">
              Ledger Account
            </span>
          </div>
          <div className="w-8 h-8 bg-[#3E424B] flex items-center justify-center font-bold text-xs select-none">
            {userProfile.displayName.charAt(0).toUpperCase()}
          </div>
        </div>
      </header>

      {/* Main Workspace Body */}
      <div className="flex-1 flex flex-col md:flex-row">
        
        {/* Left Side Navigation Rail */}
        <nav className="w-full md:w-64 border-r border-[#33353B] bg-[#25272B] p-4 flex flex-col space-y-2">
          <span className="text-[10px] font-mono text-[#6E727A] uppercase tracking-wider px-3 mb-2 block">
            Workspace Panels
          </span>

          <button
            onClick={() => setActiveTab('home')}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors ${
              activeTab === 'home' 
                ? 'bg-[#ECE0D2] text-[#1E2024]' 
                : 'text-[#9E9CA3] hover:bg-[#33353B] hover:text-[#ECE0D2]'
            }`}
          >
            <LayoutDashboard size={15} />
            <span>Overview Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab('tasks')}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors ${
              activeTab === 'tasks' 
                ? 'bg-[#ECE0D2] text-[#1E2024]' 
                : 'text-[#9E9CA3] hover:bg-[#33353B] hover:text-[#ECE0D2]'
            }`}
          >
            <FolderKanban size={15} />
            <span>Planner Board</span>
          </button>

          <button
            onClick={() => setActiveTab('calendar')}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors ${
              activeTab === 'calendar' 
                ? 'bg-[#ECE0D2] text-[#1E2024]' 
                : 'text-[#9E9CA3] hover:bg-[#33353B] hover:text-[#ECE0D2]'
            }`}
          >
            <CalendarIcon size={15} />
            <span>Calendar Queue</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors ${
              activeTab === 'analytics' 
                ? 'bg-[#ECE0D2] text-[#1E2024]' 
                : 'text-[#9E9CA3] hover:bg-[#33353B] hover:text-[#ECE0D2]'
            }`}
          >
            <Clock size={15} />
            <span>Focus Tracker</span>
          </button>

          <button
            onClick={() => setActiveTab('collaboration')}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors ${
              activeTab === 'collaboration' 
                ? 'bg-[#ECE0D2] text-[#1E2024]' 
                : 'text-[#9E9CA3] hover:bg-[#33353B] hover:text-[#ECE0D2]'
            }`}
          >
            <Users size={15} />
            <span>Team Workspace</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors ${
              activeTab === 'settings' 
                ? 'bg-[#ECE0D2] text-[#1E2024]' 
                : 'text-[#9E9CA3] hover:bg-[#33353B] hover:text-[#ECE0D2]'
            }`}
          >
            <SettingsIcon size={15} />
            <span>Identity Config</span>
          </button>

          <div className="border-t border-[#3E424B]/40 my-4 pt-4">
            <span className="text-[10px] font-mono text-[#6E727A] uppercase tracking-wider px-3 mb-2 block">
              Personal Workspace
            </span>
            <div className="px-3 py-1.5 bg-[#1E2024]/40 border border-[#33353B]">
              <p className="text-[10px] font-bold text-[#ECE0D2] truncate">
                Private Planner Board
              </p>
              <span className="text-[8px] font-mono text-[#9E9CA3]">
                {personalTasksCount} Tasks Pending
              </span>
            </div>
          </div>
        </nav>

        {/* Master Panel Workspace Content */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-h-[calc(100vh-80px)]">
          {isLoading ? (
            <div className="h-full flex items-center justify-center space-x-3">
              <span className="w-4 h-4 rounded-full border-2 border-t-transparent border-[#ECE0D2] animate-spin" />
              <span className="text-xs font-mono text-[#9E9CA3]">Syncing database ledger...</span>
            </div>
          ) : (
            <>
              {/* VIEW 1: HOME/DASHBOARD OVERVIEW */}
              {activeTab === 'home' && (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#3E424B]/40 pb-4">
                    <div>
                      <h2 className="text-2xl font-black text-[#ECE0D2] tracking-tight">
                        Welcome, {userProfile.displayName}
                      </h2>
                      <p className="text-xs text-[#9E9CA3] font-mono mt-1">
                        Workspace health and coordination overview for today
                      </p>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1 text-[#F59E0B]">
                        <Flame size={18} className="fill-current" />
                        <span className="text-sm font-bold font-mono">{metrics.streak} Day Streak</span>
                      </div>
                      <div className="flex items-center space-x-1 text-[#ECE0D2]">
                        <Clock size={18} />
                        <span className="text-sm font-bold font-mono">{metrics.totalMinutes} Min Logged</span>
                      </div>
                    </div>
                  </div>

                  {/* Overview statistics grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-[#25272B] border border-[#33353B] p-5 flex flex-col justify-between h-36">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider font-mono text-[#9E9CA3]">Personal Board Tasks</span>
                        <CheckSquare size={16} className="text-[#ECE0D2]" />
                      </div>
                      <div className="mt-4">
                        <p className="text-4xl font-extrabold font-mono text-[#ECE0D2]">
                          {tasks.filter(t => !t.teamId && t.status !== 'completed').length}
                        </p>
                        <p className="text-[10px] font-mono text-[#6E727A] mt-1">Pending items in lists</p>
                      </div>
                    </div>

                    <div className="bg-[#25272B] border border-[#33353B] p-5 flex flex-col justify-between h-36">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider font-mono text-[#9E9CA3]">Active Shared Board Tasks</span>
                        <Users size={16} className="text-[#ECE0D2]" />
                      </div>
                      <div className="mt-4">
                        <p className="text-4xl font-extrabold font-mono text-[#ECE0D2]">
                          {activeTeam ? tasks.filter(t => t.teamId === activeTeam.id && t.status !== 'completed').length : 0}
                        </p>
                        <p className="text-[10px] font-mono text-[#6E727A] mt-1">
                          {activeTeam ? `In team: ${activeTeam.name}` : 'Select a team in Team Workspace'}
                        </p>
                      </div>
                    </div>

                    <div className="bg-[#25272B] border border-[#33353B] p-5 flex flex-col justify-between h-36">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider font-mono text-[#9E9CA3]">Total Lists Created</span>
                        <FolderKanban size={16} className="text-[#ECE0D2]" />
                      </div>
                      <div className="mt-4">
                        <p className="text-4xl font-extrabold font-mono text-[#ECE0D2]">{folders.length}</p>
                        <p className="text-[10px] font-mono text-[#6E727A] mt-1">Reorder columns in Planner Board</p>
                      </div>
                    </div>
                  </div>

                  {/* AI Agent Interaction & Task Queue */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-4">
                      <h3 className="text-sm font-bold uppercase tracking-wider font-mono text-[#9E9CA3] flex items-center space-x-2">
                        <Brain size={16} />
                        <span>AI Command Console</span>
                      </h3>
                      <ChatInterface
                        messages={messages}
                        onSendMessage={handleSendMessage}
                        isChatLoading={isChatLoading}
                        agentStatus={agentStatus}
                      />
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-sm font-bold uppercase tracking-wider font-mono text-[#9E9CA3]">
                        Your Urgent Tasks
                      </h3>
                      <div className="bg-[#25272B] border border-[#33353B] p-5 space-y-3 max-h-[460px] overflow-y-auto">
                        {tasks.filter(t => t.status !== 'completed').slice(0, 5).map(task => (
                          <div
                            key={task.id}
                            className="bg-[#1E2024]/40 border border-[#3E424B] p-3 flex flex-col space-y-2 hover:border-[#9E9CA3] transition-colors"
                          >
                            <div className="flex items-start justify-between">
                              <span className="text-xs font-semibold leading-relaxed truncate max-w-[150px]">
                                {task.title}
                              </span>
                              <span className={`text-[8px] font-bold px-1.5 py-0.2 uppercase rounded ${
                                task.priority === 'high' ? 'bg-[#EF4444]/20 text-[#EF4444]' : 'bg-[#F59E0B]/20 text-[#F59E0B]'
                              }`}>
                                {task.priority}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-[10px] font-mono text-[#6E727A]">
                              <span>List: {task.folder}</span>
                              <button
                                onClick={() => handleUpdateTask(task.id || '', { status: 'completed' })}
                                className="text-[#ECE0D2] hover:underline flex items-center space-x-1"
                              >
                                <span>Complete</span>
                                <ChevronRight size={10} />
                              </button>
                            </div>
                          </div>
                        ))}

                        {tasks.filter(t => t.status !== 'completed').length === 0 && (
                          <div className="text-center py-10">
                            <CheckSquare size={24} className="text-[#6E727A] mx-auto mb-2" />
                            <p className="text-xs text-[#6E727A]">All lists clear! No tasks remaining.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* VIEW 2: PLANNER BOARD (KANBAN LIST VIEW) */}
              {activeTab === 'tasks' && (
                <div className="h-full flex flex-col space-y-6 animate-fade-in">
                  <div className="space-y-6 w-full flex-1 flex flex-col min-h-0">
                    <TaskPanel
                      tasks={tasks}
                      folders={folders}
                      onAddTask={handleAddTask}
                      onUpdateTask={handleUpdateTask}
                      onDeleteTask={handleDeleteTask}
                      onAddFolder={handleAddFolder}
                      onRenameFolder={handleRenameFolder}
                      onDeleteFolder={handleDeleteFolder}
                      onReorderFolders={handleReorderFolders}
                      activeTeam={null}
                      userTeams={userTeams}
                      userProfile={userProfile}
                    />
                  </div>
                </div>
              )}

              {/* VIEW 3: CALENDAR VIEW */}
              {activeTab === 'calendar' && (
                <div className="animate-fade-in">
                  <CalendarView tasks={tasks} />
                </div>
              )}

              {/* VIEW 4: ANALYTICS (FOCUS TRACKER / HABIT LOGGER) */}
              {activeTab === 'analytics' && (
                <div className="animate-fade-in">
                  <HabitLogger
                    focusLogs={focusLogs}
                    metrics={metrics}
                    onLogFocus={handleLogFocus}
                  />
                </div>
              )}

              {/* VIEW 5: COLLABORATION (TEAM WORKSPACE LEDGER) */}
              {activeTab === 'collaboration' && (
                <div className="animate-fade-in">
                  <TeamTaskPanel
                    tasks={tasks}
                    folders={activeTeamFolders}
                    activeTeam={activeTeam}
                    userTeams={userTeams}
                    userProfile={userProfile}
                    onLeaveTeam={handleLeaveTeam}
                    onCreateTeam={handleCreateTeam}
                    onJoinTeam={handleJoinTeam}
                    onSelectTeam={(team) => setActiveTeam(team)}
                    onAddTask={handleAddTask}
                    onUpdateTask={handleUpdateTask}
                    onDeleteTask={handleDeleteTask}
                    onAddFolder={handleAddFolder}
                    onRenameFolder={handleRenameFolder}
                    onDeleteFolder={handleDeleteFolder}
                    onReorderFolders={handleReorderFolders}
                  />
                </div>
              )}

              {/* VIEW 6: SETTINGS (IDENTITY CONFIG) */}
              {activeTab === 'settings' && (
                <div className="animate-fade-in">
                  <Settings
                    userProfile={userProfile}
                    onUpdateProfile={handleUpdateProfile}
                  />
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
