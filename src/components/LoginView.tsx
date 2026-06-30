import React, { useState } from 'react';
import { Sparkles, Calendar, Shield, Cpu, ArrowRight } from 'lucide-react';

interface LoginViewProps {
  onLogin: (name: string, email: string) => void;
  initialName?: string;
  initialEmail?: string;
}

export default function LoginView({ onLogin, initialName = '', initialEmail = '' }: LoginViewProps) {
  const [name, setName] = useState(initialName || 'Jane Doe');
  const [email, setEmail] = useState(initialEmail || 'jane.doe@example.com');
  const [pin, setPin] = useState('1234');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Name is required.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (pin.length < 4) {
      setError('Executive Access PIN must be at least 4 digits.');
      return;
    }

    setLoading(true);
    setError('');
    
    // Simulate high-fidelity secure processing
    setTimeout(() => {
      setLoading(false);
      onLogin(name.trim(), email.trim());
    }, 1000);
  };

  return (
    <div className="min-h-screen w-screen bg-[#111113] text-[#ECE0D2] flex items-center justify-center p-4 md:p-8 overflow-y-auto" id="login-container">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-[#3E2723]/15 via-transparent to-transparent pointer-events-none" />
      
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 bg-[#1D1F25]/45 border border-[#2A2D35]/50 rounded-3xl p-6 md:p-10 shadow-2xl relative backdrop-blur-md z-10" id="login-card">
        
        {/* Left column: Value proposition & Features list */}
        <div className="lg:col-span-7 flex flex-col justify-between gap-8 pr-0 lg:pr-8 lg:border-r border-[#2A2D35]/30">
          <div className="space-y-6">
            {/* Branding logo */}
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-[#3E2723] border border-[#6B4423] flex items-center justify-center text-xl shadow-lg">
                🌿
              </div>
              <div>
                <span className="font-black tracking-widest text-2xl text-[#ECE0D2] block">PRODO</span>
                <span className="text-[10px] text-[#C5A880] uppercase tracking-wider font-bold">Executive Cognitive workspace</span>
              </div>
            </div>

            {/* Title description */}
            <div className="space-y-3">
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[#ECE0D2] leading-tight">
                Plan, Block, and Sync <br className="hidden md:inline" />
                Your Focus Hours Seamlessly.
              </h1>
              <p className="text-sm text-[#C5A880]/80 leading-relaxed max-w-md">
                PRODO combines AI assistance, high-fidelity cognitive task management, and secure Google Calendar synchronization to supercharge your elite productivity.
              </p>
            </div>
          </div>

          {/* Key Features block */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            <div className="flex gap-3 p-3.5 bg-[#22242A]/40 border border-[#2A2D35]/30 rounded-2xl">
              <div className="p-2 h-9 w-9 bg-[#3E2723]/30 border border-[#6B4423]/40 rounded-xl flex items-center justify-center text-[#C5A880] shrink-0">
                <Calendar className="w-4 h-4 text-[#C5A880]" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-xs font-black uppercase text-[#ECE0D2] tracking-wider">Live Calendar Sync</h4>
                <p className="text-[11px] text-[#C5A880]/70 leading-normal">
                  Auto-sync allocated tasks to your Google Calendar instantly.
                </p>
              </div>
            </div>

            <div className="flex gap-3 p-3.5 bg-[#22242A]/40 border border-[#2A2D35]/30 rounded-2xl">
              <div className="p-2 h-9 w-9 bg-[#3E2723]/30 border border-[#6B4423]/40 rounded-xl flex items-center justify-center text-[#C5A880] shrink-0">
                <Cpu className="w-4 h-4 text-[#C5A880]" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-xs font-black uppercase text-[#ECE0D2] tracking-wider">Cognitive Planner</h4>
                <p className="text-[11px] text-[#C5A880]/70 leading-normal">
                  Brain-interpretive assistant structures and tracks habits.
                </p>
              </div>
            </div>

          </div>

          {/* Footer note */}
          <div className="text-[11px] text-[#C5A880]/40 font-bold font-mono">
            SECURE RSA/AES CLIENT SESSION • LOCAL STORAGE PERSISTENCE
          </div>
        </div>

        {/* Right column: Login form */}
        <div className="lg:col-span-5 flex flex-col justify-center">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1.5">
              <h2 className="text-xl font-black uppercase tracking-wider text-[#ECE0D2]">Sign In</h2>
              <p className="text-xs text-[#C5A880]/70">Enter your executive credentials to unlock the planner board.</p>
            </div>

            {error && (
              <div className="p-3 bg-red-900/20 border border-red-500/30 text-red-300 text-xs font-bold rounded-xl animate-fade-in">
                ⚠️ {error}
              </div>
            )}

            <div className="space-y-4">
              {/* Display name */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-wider text-[#C5A880] block">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                  placeholder="Jane Doe"
                  className="w-full h-11 px-4 bg-[#111113]/70 border border-[#2A2D35] focus:border-[#C5A880]/50 rounded-xl text-xs font-bold text-[#ECE0D2] focus:outline-none transition"
                />
              </div>

              {/* Email (Google account aligned) */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black uppercase tracking-wider text-[#C5A880] block">Email Address</label>
                  <span className="text-[9px] text-[#C5A880]/50 font-bold font-mono">Use your Google Account</span>
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  placeholder="jane.doe@example.com"
                  className="w-full h-11 px-4 bg-[#111113]/70 border border-[#2A2D35] focus:border-[#C5A880]/50 rounded-xl text-xs font-bold text-[#ECE0D2] focus:outline-none transition"
                />
              </div>

              {/* Secure Pass PIN */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black uppercase tracking-wider text-[#C5A880] block">Access PIN / Password</label>
                  <span className="text-[9px] text-[#7A967A] font-black uppercase tracking-wide flex items-center gap-1">
                    <Shield className="w-3 h-3 text-[#7A967A]" /> Secure Session
                  </span>
                </div>
                <input
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  disabled={loading}
                  placeholder="••••"
                  maxLength={12}
                  className="w-full h-11 px-4 bg-[#111113]/70 border border-[#2A2D35] focus:border-[#C5A880]/50 rounded-xl text-xs font-mono font-bold tracking-widest text-[#ECE0D2] focus:outline-none transition text-left"
                />
              </div>
            </div>

            {/* Enter workspace trigger button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-[#3E2723] hover:bg-[#4E3629] border border-[#6B4423] text-[#ECE0D2] rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition shadow-lg duration-150 disabled:opacity-50 select-none"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Enter Executive Workspace</span>
                  <ArrowRight className="w-4 h-4 text-[#ECE0D2]" />
                </>
              )}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
