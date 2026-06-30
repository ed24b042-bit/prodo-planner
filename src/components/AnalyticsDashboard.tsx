import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { FocusLog } from '../types';
import { TrendingUp, Map, Award, ShieldAlert, Sparkles, HelpCircle, Activity, LayoutGrid } from 'lucide-react';

interface AnalyticsDashboardProps {
  focusLogs: FocusLog[];
}

const LOCATION_COLORS: Record<string, string> = {
  home: '#64748b',       // Slate
  library: '#3b82f6',    // Blue
  classroom: '#8b5cf6',  // Purple
  cafe: '#f59e0b',       // Amber
  office: '#0ea5e9',     // Sky Blue
};

export default function AnalyticsDashboard({ focusLogs }: AnalyticsDashboardProps) {
  const [activeChart, setActiveChart] = useState<'activity' | 'location' | 'quality'>('activity');

  // Process Daily Focus Data
  const dailyFocusData = useMemo(() => {
    if (!focusLogs || focusLogs.length === 0) return [];

    // Group logs by date
    const groups: Record<string, { date: string; minutes: number; sessions: number }> = {};
    
    // Last 7 unique dates with data to keep chart readable
    focusLogs.forEach(log => {
      const dateKey = log.date;
      if (!groups[dateKey]) {
        // Format YYYY-MM-DD to "MMM DD"
        let displayDate = dateKey;
        try {
          const d = new Date(dateKey + 'T00:00:00');
          displayDate = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        } catch (e) {
          // Fallback
        }
        groups[dateKey] = { date: displayDate, minutes: 0, sessions: 0 };
      }
      groups[dateKey].minutes += log.duration || 0;
      groups[dateKey].sessions += 1;
    });

    return Object.values(groups)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-7); // take last 7 logged days
  }, [focusLogs]);

  // Process Location Time Allocation
  const locationData = useMemo(() => {
    if (!focusLogs || focusLogs.length === 0) return [];

    const counts: Record<string, number> = {
      home: 0,
      library: 0,
      classroom: 0,
      cafe: 0,
      office: 0
    };

    focusLogs.forEach(log => {
      const loc = log.location || 'home';
      if (counts[loc] !== undefined) {
        counts[loc] += log.duration || 0;
      }
    });

    return Object.entries(counts)
      .map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        rawName: name,
        value
      }))
      .filter(item => item.value > 0);
  }, [focusLogs]);

  // Process Focus Quality vs Distractions over time
  const focusQualityData = useMemo(() => {
    if (!focusLogs || focusLogs.length === 0) return [];

    // Show chronologically sorted focus sessions
    return [...focusLogs]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-10) // show last 10 sessions
      .map((log, index) => {
        let displayDate = log.date;
        try {
          const d = new Date(log.date + 'T00:00:00');
          displayDate = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        } catch (e) {}

        return {
          session: `S${index + 1} (${displayDate})`,
          rating: log.rating,
          distractions: log.distractions,
          duration: log.duration
        };
      });
  }, [focusLogs]);

  // Custom Tooltip for Daily Focus
  const CustomDailyTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-zinc-950 border border-zinc-800 text-white rounded-xl p-3 shadow-lg text-xs font-sans">
          <p className="font-semibold text-zinc-300 mb-1">{data.date}</p>
          <p className="text-zinc-100">Focused: <span className="font-bold text-amber-400 font-mono">{data.minutes} mins</span></p>
          <p className="text-zinc-400">Sessions: <span className="font-mono">{data.sessions}</span></p>
        </div>
      );
    }
    return null;
  };

  // Custom Tooltip for Location
  const CustomLocationTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-zinc-950 border border-zinc-800 text-white rounded-xl p-3 shadow-lg text-xs font-sans">
          <p className="font-semibold text-zinc-300 capitalize mb-1">{data.name}</p>
          <p className="text-zinc-100">Total focus: <span className="font-bold text-blue-400 font-mono">{data.value} mins</span></p>
        </div>
      );
    }
    return null;
  };

  // Custom Tooltip for Quality
  const CustomQualityTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-zinc-950 border border-zinc-800 text-white rounded-xl p-3 shadow-lg text-xs font-sans">
          <p className="font-semibold text-zinc-300 mb-1">{data.session}</p>
          <p className="text-emerald-400">Focus Rating: <span className="font-bold font-mono">{data.rating}/5</span></p>
          <p className="text-rose-400">Distractions: <span className="font-bold font-mono">{data.distractions}</span></p>
          <p className="text-zinc-400">Session duration: <span className="font-mono">{data.duration}m</span></p>
        </div>
      );
    }
    return null;
  };

  if (!focusLogs || focusLogs.length === 0) {
    return (
      <div className="bg-white border border-zinc-200 rounded-2xl p-8 text-center flex flex-col items-center justify-center gap-3 shadow-sm animate-fade-in" id="analytics-placeholder">
        <div className="w-12 h-12 bg-zinc-50 border border-zinc-150 rounded-xl flex items-center justify-center text-zinc-400">
          <Activity className="w-6 h-6 animate-pulse" />
        </div>
        <h3 className="text-sm font-semibold text-zinc-800">Your Focus Metrics Dashboard</h3>
        <p className="text-xs text-zinc-500 max-w-sm leading-relaxed">
          Start logging deep work focus blocks using the timer or manual logs to automatically compile interactive productivity charts.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm flex flex-col gap-5 animate-fade-in" id="analytics-dashboard-root">
      {/* Dashboard Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 pb-4">
        <div>
          <h3 className="text-sm font-semibold text-zinc-900 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-zinc-800" /> Professional Metrics Dashboard
          </h3>
          <p className="text-[11px] text-zinc-500 font-sans mt-0.5">Interactive graphs generated from your focus session history.</p>
        </div>

        {/* Chart Selector Tabs */}
        <div className="flex bg-zinc-100 rounded-xl p-1 border border-zinc-200 self-start sm:self-center">
          <button
            onClick={() => setActiveChart('activity')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
              activeChart === 'activity'
                ? 'bg-white text-zinc-900 shadow-3xs'
                : 'text-zinc-500 hover:text-zinc-850'
            }`}
          >
            Activity Logs
          </button>
          <button
            onClick={() => setActiveChart('location')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
              activeChart === 'location'
                ? 'bg-white text-zinc-900 shadow-3xs'
                : 'text-zinc-500 hover:text-zinc-850'
            }`}
          >
            Study Locations
          </button>
          <button
            onClick={() => setActiveChart('quality')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
              activeChart === 'quality'
                ? 'bg-white text-zinc-900 shadow-3xs'
                : 'text-zinc-500 hover:text-zinc-850'
            }`}
          >
            Focus Quality
          </button>
        </div>
      </div>

      {/* Graphs Wrapper */}
      <div className="h-[280px] w-full relative">
        {activeChart === 'activity' && (
          <div className="h-full w-full animate-fade-in flex flex-col justify-between">
            <ResponsiveContainer width="100%" height="90%">
              <BarChart data={dailyFocusData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} unit="m" />
                <Tooltip content={<CustomDailyTooltip />} cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="minutes" fill="#18181b" radius={[6, 6, 0, 0]} barSize={35} />
              </BarChart>
            </ResponsiveContainer>
            <div className="text-[10px] text-zinc-400 font-sans text-center mt-1">
              Bar chart of focused minutes per session date (last 7 logged days)
            </div>
          </div>
        )}

        {activeChart === 'location' && (
          <div className="h-full w-full animate-fade-in flex flex-col sm:flex-row items-center justify-center gap-6">
            <div className="h-[180px] w-[180px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip content={<CustomLocationTooltip />} />
                  <Pie
                    data={locationData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {locationData.map((entry) => (
                      <Cell key={`cell-${entry.rawName}`} fill={LOCATION_COLORS[entry.rawName] || '#94a3b8'} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-400">Total Location</span>
                <span className="text-base font-bold text-zinc-800 font-mono">
                  {locationData.reduce((acc, curr) => acc + curr.value, 0)}m
                </span>
              </div>
            </div>

            {/* Pie Legends */}
            <div className="flex flex-col gap-2 shrink-0 max-w-[200px]">
              {locationData.map((item) => (
                <div key={item.name} className="flex items-center gap-2 text-xs font-medium text-zinc-700">
                  <span
                    className="w-3 h-3 rounded-md shrink-0"
                    style={{ backgroundColor: LOCATION_COLORS[item.rawName] }}
                  />
                  <span className="truncate">{item.name}:</span>
                  <span className="font-bold font-mono text-zinc-900 ml-auto">{item.value}m</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeChart === 'quality' && (
          <div className="h-full w-full animate-fade-in flex flex-col justify-between">
            <ResponsiveContainer width="100%" height="90%">
              <LineChart data={focusQualityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="session" stroke="#94a3b8" fontSize={9} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} domain={[0, 5]} />
                <Tooltip content={<CustomQualityTooltip />} />
                <Legend iconSize={10} wrapperStyle={{ fontSize: 11, paddingTop: 5 }} />
                <Line
                  name="Focus Score (1-5)"
                  type="monotone"
                  dataKey="rating"
                  stroke="#10b981" // Emerald
                  strokeWidth={2.5}
                  dot={{ r: 4, strokeWidth: 1 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  name="Distractions"
                  type="monotone"
                  dataKey="distractions"
                  stroke="#ef4444" // Red
                  strokeWidth={2.5}
                  dot={{ r: 4, strokeWidth: 1 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
            <div className="text-[10px] text-zinc-400 font-sans text-center mt-1">
              Dual-line graph showing the correlation of your focus rating and distractions (last 10 sessions)
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
