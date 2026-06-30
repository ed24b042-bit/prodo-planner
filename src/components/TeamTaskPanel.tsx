import { useState } from 'react';
import { 
  Users, 
  Copy, 
  LogOut, 
  FolderKanban, 
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { Team, UserProfile, Task } from '../types';
import TaskPanel from './TaskPanel';

interface TeamTaskPanelProps {
  tasks: Task[];
  folders: string[];
  activeTeam: Team | null;
  userTeams: Team[];
  userProfile: UserProfile;
  onLeaveTeam: (teamId: string) => void;
  onCreateTeam: (name: string) => void;
  onJoinTeam: (code: string) => void;
  onSelectTeam: (team: Team | null) => void; // For switching boards
  onAddTask: (task: any) => void;
  onUpdateTask: (id: string, updates: any) => void;
  onDeleteTask: (id: string) => void;
  onAddFolder: (name: string, teamId?: string | null) => void;
  onRenameFolder: (oldName: string, newName: string, teamId?: string | null) => void;
  onDeleteFolder: (name: string, teamId?: string | null) => void;
  onReorderFolders: (newFolders: string[], teamId?: string | null) => Promise<boolean>;
}

export default function TeamTaskPanel({
  tasks,
  folders,
  activeTeam,
  userTeams,
  userProfile,
  onLeaveTeam,
  onCreateTeam,
  onJoinTeam,
  onSelectTeam,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onAddFolder,
  onRenameFolder,
  onDeleteFolder,
  onReorderFolders
}: TeamTaskPanelProps) {
  const [teamName, setTeamName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [boardDropdownOpen, setBoardDropdownOpen] = useState(false);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (teamName.trim()) {
      onCreateTeam(teamName.trim());
      setTeamName('');
      setShowCreateForm(false);
    }
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inviteCode.trim()) {
      onJoinTeam(inviteCode.trim());
      setInviteCode('');
      setShowJoinForm(false);
    }
  };

  return (
    <div id="team-task-panel-root" className="h-full flex flex-col space-y-6">
      
      {/* Active Board Dropdown Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#3E424B]/40 pb-6">
        <div className="relative">
          <label className="block text-[10px] font-mono text-[#9E9CA3] uppercase tracking-wider mb-1">
            Active Workspace Board
          </label>
          <button
            onClick={() => setBoardDropdownOpen(!boardDropdownOpen)}
            className="flex items-center space-x-3 bg-[#25272B] border border-[#3E424B] px-4 py-2.5 hover:border-[#ECE0D2] transition-all text-sm font-semibold text-[#ECE0D2] min-w-[240px] justify-between"
          >
            <div className="flex items-center space-x-2 truncate">
              {activeTeam ? (
                <>
                  <Users size={16} className="text-[#ECE0D2] flex-shrink-0" />
                  <span className="truncate">{activeTeam.name} Board</span>
                </>
              ) : (
                <>
                  <FolderKanban size={16} className="text-[#ECE0D2] flex-shrink-0" />
                  <span>Personal Board</span>
                </>
              )}
            </div>
            <ChevronDown size={14} className={`text-[#9E9CA3] transition-transform ${boardDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {boardDropdownOpen && (
            <div className="absolute z-50 left-0 mt-1 w-full bg-[#25272B] border border-[#3E424B] shadow-2xl animate-fade-in py-1">
              {/* Personal Option */}
              <button
                onClick={() => {
                  onSelectTeam(null);
                  setBoardDropdownOpen(false);
                }}
                className={`w-full text-left px-4 py-2.5 text-xs font-semibold hover:bg-[#33353B] flex items-center space-x-2 ${
                  !activeTeam ? 'bg-[#3E424B]/40 text-[#ECE0D2]' : 'text-[#9E9CA3]'
                }`}
              >
                <FolderKanban size={14} />
                <span>Personal Board</span>
              </button>

              {/* Team Options */}
              {userTeams.map(team => (
                <button
                  key={team.id}
                  onClick={() => {
                    onSelectTeam(team);
                    setBoardDropdownOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 text-xs font-semibold hover:bg-[#33353B] flex items-center justify-between ${
                    activeTeam?.id === team.id ? 'bg-[#3E424B]/40 text-[#ECE0D2]' : 'text-[#9E9CA3]'
                  }`}
                >
                  <div className="flex items-center space-x-2 truncate">
                    <Users size={14} />
                    <span className="truncate">{team.name}</span>
                  </div>
                  <span className="text-[9px] font-mono bg-[#3E424B] px-1.5 py-0.2 rounded-full text-[#ECE0D2]">
                    {team.members.length}
                  </span>
                </button>
              ))}

              {userTeams.length === 0 && (
                <div className="px-4 py-2 text-[10px] font-mono text-[#6E727A]">
                  No teams joined yet
                </div>
              )}
            </div>
          )}
        </div>

        {/* Create or Join team control buttons */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              setShowJoinForm(!showJoinForm);
              setShowCreateForm(false);
            }}
            className="border border-[#3E424B] text-[#ECE0D2] px-4 py-2 text-xs font-semibold hover:border-[#ECE0D2] transition-colors"
          >
            Join with Code
          </button>
          <button
            onClick={() => {
              setShowCreateForm(!showCreateForm);
              setShowJoinForm(false);
            }}
            className="bg-[#ECE0D2] text-[#1E2024] px-4 py-2 text-xs font-bold hover:bg-[#D9CDBF] transition-colors"
          >
            Create Team
          </button>
        </div>
      </div>

      {/* Interactive forms */}
      {showCreateForm && (
        <form onSubmit={handleCreateSubmit} className="bg-[#292B30] border border-[#3E424B] p-5 space-y-4 animate-fade-in">
          <h3 className="text-sm font-bold text-[#ECE0D2]">Create a New Shared Workspace</h3>
          <div className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              required
              value={teamName}
              onChange={e => setTeamName(e.target.value)}
              placeholder="E.g., Engineering, Marketing Group..."
              className="flex-1 bg-[#1E2024] border border-[#3E424B] px-3 py-2 text-sm text-[#ECE0D2] placeholder-[#7E7C83] focus:outline-none focus:border-[#ECE0D2]"
            />
            <button
              type="submit"
              className="bg-[#ECE0D2] text-[#1E2024] px-5 py-2 text-xs font-bold hover:bg-[#D9CDBF]"
            >
              Initialize Workspace
            </button>
          </div>
        </form>
      )}

      {showJoinForm && (
        <form onSubmit={handleJoinSubmit} className="bg-[#292B30] border border-[#3E424B] p-5 space-y-4 animate-fade-in">
          <h3 className="text-sm font-bold text-[#ECE0D2]">Join a Shared Workspace</h3>
          <div className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              required
              value={inviteCode}
              onChange={e => setInviteCode(e.target.value)}
              placeholder="Enter Invite Code (e.g., TEAM-ABCD12)..."
              className="flex-1 bg-[#1E2024] border border-[#3E424B] px-3 py-2 text-sm text-[#ECE0D2] placeholder-[#7E7C83] focus:outline-none focus:border-[#ECE0D2]"
            />
            <button
              type="submit"
              className="bg-[#ECE0D2] text-[#1E2024] px-5 py-2 text-xs font-bold hover:bg-[#D9CDBF]"
            >
              Join Workspace
            </button>
          </div>
        </form>
      )}

      {/* Active Team Dashboard Space */}
      {activeTeam ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Members Panel */}
            <div className="lg:col-span-1 bg-[#25272B] border border-[#33353B] p-5 flex flex-col space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#ECE0D2] uppercase tracking-wider font-mono">
                  Teammates ({activeTeam.members.length})
                </h3>
                <button
                  onClick={() => onLeaveTeam(activeTeam.id)}
                  className="text-[#EF4444] hover:underline text-[10px] flex items-center space-x-1 font-semibold"
                  title="Leave Team Workspace"
                >
                  <LogOut size={12} />
                  <span>Leave</span>
                </button>
              </div>

              {/* List of Active Teammates (Strictly from database membership!) */}
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {activeTeam.members.map(memberId => {
                  const name = activeTeam.memberNames?.[memberId] || 'Unknown Teammate';
                  const isMe = memberId === userProfile.id;
                  
                  return (
                    <div
                      key={memberId}
                      className="bg-[#1E2024] border border-[#3E424B] px-3 py-2.5 flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3 truncate">
                        <div className="w-7 h-7 bg-[#3E424B] flex items-center justify-center font-mono font-bold text-xs text-[#ECE0D2]">
                          {name.charAt(0).toUpperCase()}
                        </div>
                        <div className="truncate">
                          <p className="text-xs font-medium text-[#ECE0D2] truncate">
                            {name}
                          </p>
                          <p className="text-[9px] font-mono text-[#9E9CA3]">
                            {isMe ? 'Creator/You' : 'Member'}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Invite Info Section */}
              <div className="border-t border-[#3E424B]/40 pt-4 space-y-3">
                <span className="text-[10px] font-mono text-[#9E9CA3] block">
                  Workspace Invite Code
                </span>
                <div className="bg-[#1E2024] border border-[#3E424B] p-2 flex items-center justify-between font-mono text-xs">
                  <span className="text-[#ECE0D2] font-bold select-all">
                    {activeTeam.code}
                  </span>
                  <button
                    onClick={() => handleCopyCode(activeTeam.code)}
                    className="text-[#9E9CA3] hover:text-[#ECE0D2] transition-colors"
                    title="Copy Code"
                  >
                    {copied ? <span className="text-[10px] text-green-400 font-bold">Copied!</span> : <Copy size={14} />}
                  </button>
                </div>
                <p className="text-[10px] text-[#6E727A] leading-normal">
                  Share this code with teammates to allow them to join this board and coordinate lists & tasks.
                </p>
              </div>
            </div>

            {/* Quick Metrics & Overview */}
            <div className="lg:col-span-2 bg-[#25272B] border border-[#33353B] p-5 flex flex-col space-y-6">
              <h3 className="text-sm font-bold text-[#ECE0D2] uppercase tracking-wider font-mono">
                Team Workspace Status
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-[#1E2024] border border-[#3E424B] p-4 text-center">
                  <p className="text-2xl font-bold font-mono text-[#ECE0D2]">
                    {tasks.filter(t => t.teamId === activeTeam.id).length}
                  </p>
                  <p className="text-[10px] font-mono text-[#9E9CA3] uppercase mt-1">Total Tasks</p>
                </div>

                <div className="bg-[#1E2024] border border-[#3E424B] p-4 text-center">
                  <p className="text-2xl font-bold font-mono text-[#A3E635]">
                    {tasks.filter(t => t.teamId === activeTeam.id && t.status === 'completed').length}
                  </p>
                  <p className="text-[10px] font-mono text-[#9E9CA3] uppercase mt-1">Completed</p>
                </div>

                <div className="bg-[#1E2024] border border-[#3E424B] p-4 text-center">
                  <p className="text-2xl font-bold font-mono text-[#F59E0B]">
                    {tasks.filter(t => t.teamId === activeTeam.id && t.status === 'inprogress').length}
                  </p>
                  <p className="text-[10px] font-mono text-[#9E9CA3] uppercase mt-1">In Progress</p>
                </div>
              </div>

              {/* Board Navigation Instructions */}
              <div className="bg-[#1E2024] border border-[#3E424B] p-5 rounded space-y-3">
                <h4 className="text-xs font-bold text-[#ECE0D2]">Active Team Board Controls</h4>
                <p className="text-xs text-[#9E9CA3] leading-relaxed">
                  You are currently viewing the shared **"{activeTeam.name}"** workspace board. Any lists created, renamed, or deleted in the Planner Board tab while in this team context will be shared in real-time with all team members.
                </p>
                <p className="text-xs text-[#9E9CA3] leading-relaxed">
                  Similarly, tasks added, updated, or reordered inside list columns will update globally for the team. 
                </p>
                <button
                  onClick={() => onSelectTeam(null)}
                  className="text-xs text-[#ECE0D2] font-semibold flex items-center space-x-1 hover:underline pt-2"
                >
                  <span>Switch back to Personal Board</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>

          <div className="border-t border-[#3E424B]/40 pt-6">
            <h3 className="text-sm font-bold text-[#ECE0D2] uppercase tracking-wider font-mono mb-4 flex items-center space-x-2">
              <FolderKanban size={16} className="text-[#ECE0D2]" />
              <span>Team Shared Planner Board</span>
            </h3>
            <TaskPanel
              tasks={tasks}
              folders={folders}
              onAddTask={onAddTask}
              onUpdateTask={onUpdateTask}
              onDeleteTask={onDeleteTask}
              onAddFolder={(name) => onAddFolder(name, activeTeam.id)}
              onRenameFolder={(oldName, newName) => onRenameFolder(oldName, newName, activeTeam.id)}
              onDeleteFolder={(name) => onDeleteFolder(name, activeTeam.id)}
              onReorderFolders={(newFolders) => onReorderFolders(newFolders, activeTeam.id)}
              activeTeam={activeTeam}
              userTeams={userTeams}
              userProfile={userProfile}
            />
          </div>
        </div>
      ) : (
        /* Empty Team State */
        <div className="bg-[#25272B] border border-[#33353B] p-10 text-center flex flex-col items-center justify-center max-w-2xl mx-auto space-y-5 my-10">
          <Users size={48} className="text-[#6E727A]" />
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-[#ECE0D2]">Join or Create a Team Board</h3>
            <p className="text-sm text-[#9E9CA3] leading-relaxed max-w-md">
              Create a shared workspace to coordinate lists, tasks, and schedules with your teammates in real-time. Or join an existing workspace using a shared invite code.
            </p>
          </div>
          <div className="flex items-center space-x-4 pt-2">
            <button
              onClick={() => {
                setShowJoinForm(true);
                setShowCreateForm(false);
              }}
              className="border border-[#3E424B] text-[#ECE0D2] px-4 py-2 text-xs font-semibold hover:border-[#ECE0D2]"
            >
              Join Team Workspace
            </button>
            <button
              onClick={() => {
                setShowCreateForm(true);
                setShowJoinForm(false);
              }}
              className="bg-[#ECE0D2] text-[#1E2024] px-4 py-2 text-xs font-bold hover:bg-[#D9CDBF]"
            >
              Initialize Workspace
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
