import { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Flame, CheckCircle, Tag, Clock } from 'lucide-react';
import { FocusLog, StreakMetrics } from '../types';

interface HabitLoggerProps {
  focusLogs: FocusLog[];
  metrics: StreakMetrics;
  onLogFocus: (taskTitle: string, duration: number, tag: string) => void;
}

export default function HabitLogger({
  focusLogs,
  metrics,
  onLogFocus
}: HabitLoggerProps) {
  const [taskTitle, setTaskTitle] = useState('');
  const [selectedTag, setSelectedTag] = useState('Deep Work');
  const [timerMinutes, setTimerMinutes] = useState(25);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [initialMinutes, setInitialMinutes] = useState(25);

  const tags = ['Deep Work', 'Engineering', 'Meetings', 'Learning', 'Personal', 'Review'];

  useEffect(() => {
    let interval: any = null;
    if (timerActive) {
      interval = setInterval(() => {
        if (timerSeconds === 0) {
          if (timerMinutes === 0) {
            // Timer Finished
            setTimerActive(false);
            handleTimerComplete();
          } else {
            setTimerMinutes(timerMinutes - 1);
            setTimerSeconds(59);
          }
        } else {
          setTimerSeconds(timerSeconds - 1);
        }
      }, 1000);
    } else {
      if (interval) clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timerActive, timerMinutes, timerSeconds]);

  const handleTimerComplete = () => {
    const title = taskTitle.trim() || 'Custom Focus Block';
    onLogFocus(title, initialMinutes, selectedTag);
    setTaskTitle('');
    // Reset timer
    setTimerMinutes(initialMinutes);
    setTimerSeconds(0);
    alert(`Congratulations! You've completed your "${title}" focus block!`);
  };

  const toggleTimer = () => {
    setTimerActive(!timerActive);
  };

  const resetTimer = () => {
    setTimerActive(false);
    setTimerMinutes(initialMinutes);
    setTimerSeconds(0);
  };

  const changePreset = (minutes: number) => {
    setTimerActive(false);
    setInitialMinutes(minutes);
    setTimerMinutes(minutes);
    setTimerSeconds(0);
  };

  return (
    <div id="habit-logger-root" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* 1. Focus Timer Panel */}
      <div className="lg:col-span-2 bg-[#25272B] border border-[#33353B] p-6 flex flex-col items-center justify-center space-y-6">
        <div className="text-center">
          <h3 className="text-sm font-bold uppercase tracking-wider font-mono text-[#9E9CA3]">
            Pomodoro Focus Hub
          </h3>
          <p className="text-xs text-[#6E727A] mt-1">Immerse yourself in distraction-free work blocks</p>
        </div>

        {/* Timer Face */}
        <div className="relative w-64 h-64 rounded-full border-4 border-[#3E424B] flex flex-col items-center justify-center bg-[#1E2024]/40 shadow-inner">
          <span className="text-6xl font-bold font-mono tracking-tight text-[#ECE0D2]">
            {String(timerMinutes).padStart(2, '0')}:{String(timerSeconds).padStart(2, '0')}
          </span>
          <span className="text-xs font-mono text-[#9E9CA3] mt-2 uppercase tracking-widest">
            {timerActive ? 'FOCUSING' : 'READY'}
          </span>
        </div>

        {/* Preset selections */}
        <div className="flex items-center space-x-2 bg-[#1E2024] p-1 border border-[#3E424B] rounded">
          {[15, 25, 45, 60].map(m => (
            <button
              key={m}
              onClick={() => changePreset(m)}
              className={`px-3 py-1 text-xs font-mono rounded ${
                initialMinutes === m ? 'bg-[#3E424B] text-[#ECE0D2] font-bold' : 'text-[#9E9CA3] hover:text-[#ECE0D2]'
              }`}
            >
              {m}m
            </button>
          ))}
        </div>

        {/* Quick config */}
        <div className="w-full max-w-sm space-y-4">
          <div className="space-y-1">
            <label className="block text-[10px] font-mono text-[#9E9CA3] uppercase">Focus Objective</label>
            <input
              type="text"
              value={taskTitle}
              onChange={e => setTaskTitle(e.target.value)}
              placeholder="What are you focusing on?"
              className="w-full bg-[#1E2024] border border-[#3E424B] px-3 py-2 text-sm text-[#ECE0D2] placeholder-[#7E7C83] focus:outline-none focus:border-[#ECE0D2]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-[10px] font-mono text-[#9E9CA3] uppercase font-semibold">Activity Tag</label>
              <select
                value={selectedTag}
                onChange={e => setSelectedTag(e.target.value)}
                className="w-full bg-[#1E2024] border border-[#3E424B] px-3 py-2 text-xs text-[#ECE0D2] focus:outline-none focus:border-[#ECE0D2]"
              >
                {tags.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className="flex items-end space-x-2">
              <button
                onClick={toggleTimer}
                className={`flex-1 py-2 flex items-center justify-center space-x-2 text-xs font-bold transition-all ${
                  timerActive 
                    ? 'bg-[#EF4444] text-[#ECE0D2] hover:bg-red-600' 
                    : 'bg-[#ECE0D2] text-[#1E2024] hover:bg-[#D9CDBF]'
                }`}
              >
                {timerActive ? <Pause size={14} /> : <Play size={14} />}
                <span>{timerActive ? 'Pause' : 'Start'}</span>
              </button>
              <button
                onClick={resetTimer}
                className="border border-[#3E424B] text-[#9E9CA3] hover:text-[#ECE0D2] p-2 hover:border-[#9E9CA3] transition-colors"
                title="Reset Timer"
              >
                <RotateCcw size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Stats & Logs Panel */}
      <div className="space-y-6">
        {/* Metric widgets */}
        <div className="bg-[#25272B] border border-[#33353B] p-5 space-y-4">
          <h4 className="text-xs font-bold text-[#ECE0D2] uppercase tracking-wider font-mono">
            Focus Indicators
          </h4>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#1E2024] border border-[#3E424B] p-3 text-center flex flex-col justify-between h-20">
              <span className="text-xs text-[#9E9CA3] font-mono">Streak</span>
              <div className="flex items-center justify-center space-x-1 mt-1 text-[#F59E0B]">
                <Flame size={16} className="fill-current" />
                <span className="text-xl font-bold font-mono">{metrics.streak}d</span>
              </div>
            </div>

            <div className="bg-[#1E2024] border border-[#3E424B] p-3 text-center flex flex-col justify-between h-20">
              <span className="text-xs text-[#9E9CA3] font-mono">Total Time</span>
              <div className="flex items-center justify-center space-x-1 mt-1 text-[#ECE0D2]">
                <Clock size={16} />
                <span className="text-xl font-bold font-mono">{metrics.totalMinutes}m</span>
              </div>
            </div>
          </div>
        </div>

        {/* Activity Logs history */}
        <div className="bg-[#25272B] border border-[#33353B] p-5 flex flex-col space-y-4 h-[300px]">
          <h4 className="text-xs font-bold text-[#ECE0D2] uppercase tracking-wider font-mono">
            Focus History Logs
          </h4>

          <div className="flex-1 overflow-y-auto space-y-2">
            {focusLogs.map(log => (
              <div
                key={log.id}
                className="bg-[#1E2024] border border-[#3E424B] p-3 flex flex-col space-y-2 rounded"
              >
                <div className="flex items-start justify-between">
                  <span className="text-xs font-semibold text-[#ECE0D2] leading-tight truncate max-w-[150px]">
                    {log.taskTitle}
                  </span>
                  <span className="text-[9px] font-mono bg-[#3E424B] px-1.5 py-0.2 rounded text-[#9E9CA3] flex items-center space-x-1">
                    <Tag size={8} />
                    <span>{log.tag}</span>
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px] font-mono text-[#6E727A]">
                  <span>{new Date(log.startTime).toLocaleTimeString()}</span>
                  <span className="text-[#A3E635] font-bold">+{log.duration} mins</span>
                </div>
              </div>
            ))}

            {focusLogs.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center p-4">
                <CheckCircle size={24} className="text-[#6E727A]" />
                <p className="text-xs text-[#6E727A] mt-2">No focus sessions logged today</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
