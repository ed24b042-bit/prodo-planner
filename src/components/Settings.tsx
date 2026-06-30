import { useState } from 'react';
import { User, Info, Database } from 'lucide-react';
import { UserProfile } from '../types';

interface SettingsProps {
  userProfile: UserProfile;
  onUpdateProfile: (updates: Partial<UserProfile>) => void;
}

export default function Settings({ userProfile, onUpdateProfile }: SettingsProps) {
  const [displayName, setDisplayName] = useState(userProfile.displayName);
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (displayName.trim()) {
      onUpdateProfile({ displayName: displayName.trim() });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }
  };

  return (
    <div id="settings-root" className="max-w-2xl mx-auto space-y-6">
      
      {/* 1. Account Settings */}
      <form onSubmit={handleSubmit} className="bg-[#25272B] border border-[#33353B] p-6 space-y-5">
        <div className="flex items-center space-x-3 border-b border-[#3E424B]/40 pb-4">
          <User size={18} className="text-[#ECE0D2]" />
          <h3 className="text-sm font-bold uppercase tracking-wider font-mono text-[#ECE0D2]">
            User Identity Profile
          </h3>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <label className="block text-[10px] font-mono text-[#9E9CA3] uppercase">Primary User ID</label>
            <input
              type="text"
              disabled
              value={userProfile.id}
              className="w-full bg-[#1E2024]/40 border border-[#3E424B] px-3 py-2 text-xs text-[#6E727A] font-mono select-all focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-mono text-[#9E9CA3] uppercase">Display Username</label>
            <input
              type="text"
              required
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="E.g., Senior Engineer..."
              className="w-full bg-[#1E2024] border border-[#3E424B] px-3 py-2 text-xs text-[#ECE0D2] focus:outline-none focus:border-[#ECE0D2]"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          {success ? (
            <span className="text-xs text-green-400 font-bold font-mono">
              Identity updated successfully!
            </span>
          ) : (
            <span className="text-[10px] text-[#6E727A] font-mono">
              This name will show on team task assignments.
            </span>
          )}
          <button
            type="submit"
            className="bg-[#ECE0D2] text-[#1E2024] px-5 py-2 text-xs font-bold hover:bg-[#D9CDBF]"
          >
            Save Profile
          </button>
        </div>
      </form>

      {/* 2. Platform Stats Info */}
      <div className="bg-[#25272B] border border-[#33353B] p-6 space-y-4">
        <div className="flex items-center space-x-3 border-b border-[#3E424B]/40 pb-4">
          <Database size={18} className="text-[#ECE0D2]" />
          <h3 className="text-sm font-bold uppercase tracking-wider font-mono text-[#ECE0D2]">
            Local Workspace Status
          </h3>
        </div>

        <div className="space-y-3 text-xs leading-relaxed text-[#9E9CA3]">
          <p>
            Your lists, tasks, team ledger workspaces, and chats are saved persistently inside a local <code className="bg-[#1E2024] text-[#ECE0D2] px-1 py-0.5 font-mono">db.json</code> database.
          </p>
          <div className="flex items-center space-x-2 text-[10px] font-mono bg-[#1E2024]/40 border border-[#3E424B] p-3 text-[#ECE0D2]">
            <Info size={14} className="text-blue-400" />
            <span>Database synchronized with server-side filesystem state.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
