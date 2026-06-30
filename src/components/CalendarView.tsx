import { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Clock, AlertCircle } from 'lucide-react';
import { Task } from '../types';

interface CalendarViewProps {
  tasks: Task[];
}

export default function CalendarView({ tasks }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Get start day of month and number of days
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const getTasksForDay = (day: number) => {
    return tasks.filter(task => {
      if (task.scheduledDate) {
        const [tYear, tMonth, tDay] = task.scheduledDate.split('-').map(Number);
        return tDay === day && (tMonth - 1) === month && tYear === year;
      }
      if (!task.createdAt) return false;
      const tDate = new Date(task.createdAt);
      return tDate.getDate() === day && tDate.getMonth() === month && tDate.getFullYear() === year;
    });
  };

  const daysGrid: Array<number | null> = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    daysGrid.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    daysGrid.push(d);
  }

  return (
    <div id="calendar-view-root" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Calendar Grid Panel */}
      <div className="lg:col-span-2 bg-[#25272B] border border-[#33353B] p-5 flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Calendar size={18} className="text-[#ECE0D2]" />
            <h3 className="text-sm font-bold uppercase tracking-wider font-mono text-[#ECE0D2]">
              {monthNames[month]} {year}
            </h3>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrevMonth}
              className="border border-[#3E424B] text-[#9E9CA3] hover:text-[#ECE0D2] p-1.5 hover:border-[#9E9CA3]"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={handleNextMonth}
              className="border border-[#3E424B] text-[#9E9CA3] hover:text-[#ECE0D2] p-1.5 hover:border-[#9E9CA3]"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* Days Header */}
        <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-mono text-[#6E727A] uppercase">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="py-1">{day}</div>
          ))}
        </div>

        {/* Month Days Grid */}
        <div className="grid grid-cols-7 gap-2">
          {daysGrid.map((day, idx) => {
            const dayTasks = day ? getTasksForDay(day) : [];
            const isToday = day && 
              new Date().getDate() === day && 
              new Date().getMonth() === month && 
              new Date().getFullYear() === year;

            return (
              <div
                key={idx}
                className={`min-h-[80px] border p-2 flex flex-col space-y-1 justify-between transition-all select-none ${
                  day 
                    ? isToday 
                      ? 'bg-[#3E424B]/30 border-[#ECE0D2]' 
                      : 'bg-[#1E2024]/40 border-[#33353B] hover:bg-[#25272B]'
                    : 'bg-transparent border-transparent'
                }`}
              >
                {day && (
                  <>
                    <span className={`text-[10px] font-bold font-mono ${isToday ? 'text-[#ECE0D2]' : 'text-[#6E727A]'}`}>
                      {day}
                    </span>
                    <div className="space-y-1 flex-1 overflow-y-auto max-h-[50px] scrollbar-thin">
                      {dayTasks.slice(0, 2).map(task => (
                        <div
                          key={task.id}
                          className={`px-1.5 py-0.5 rounded-[2px] text-[8px] truncate leading-tight font-semibold uppercase ${
                            task.status === 'completed'
                              ? 'bg-[#3E424B]/40 text-[#6E727A] line-through'
                              : task.priority === 'high'
                                ? 'bg-[#EF4444]/20 text-[#EF4444]'
                                : 'bg-[#F59E0B]/20 text-[#F59E0B]'
                          }`}
                        >
                          {task.title}
                        </div>
                      ))}
                      {dayTasks.length > 2 && (
                        <div className="text-[7px] font-mono text-[#9E9CA3] text-center font-bold">
                          +{dayTasks.length - 2} more
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Upcoming Schedule list */}
      <div className="bg-[#25272B] border border-[#33353B] p-5 flex flex-col space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider font-mono text-[#ECE0D2]">
          Schedule Queue
        </h3>

        <div className="flex-1 overflow-y-auto space-y-3 max-h-[400px]">
          {tasks.filter(t => t.status !== 'completed').slice(0, 10).map(task => {
            const dateStr = task.scheduledDate 
              ? `${task.scheduledDate}${task.scheduledTime ? ` @ ${task.scheduledTime}` : ''}`
              : (task.createdAt ? new Date(task.createdAt).toLocaleDateString() : 'Unscheduled');

            return (
              <div
                key={task.id}
                className="bg-[#1E2024] border border-[#3E424B] p-3 flex flex-col space-y-2 rounded hover:border-[#9E9CA3] transition-all"
              >
                <div className="flex items-start justify-between">
                  <span className="text-xs font-semibold text-[#ECE0D2] leading-relaxed truncate max-w-[160px]">
                    {task.title}
                  </span>
                  <span className={`text-[8px] font-bold px-1.5 py-0.2 uppercase rounded ${
                    task.priority === 'high' 
                      ? 'bg-[#EF4444]/20 text-[#EF4444]' 
                      : 'bg-[#F59E0B]/20 text-[#F59E0B]'
                  }`}>
                    {task.priority}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px] font-mono text-[#6E727A]">
                  <span className="flex items-center space-x-1">
                    <Clock size={10} />
                    <span>{task.duration}m</span>
                  </span>
                  <span className="text-xs text-[#9E9CA3] font-bold truncate max-w-[120px]" title={dateStr}>{dateStr}</span>
                </div>
              </div>
            );
          })}

          {tasks.filter(t => t.status !== 'completed').length === 0 && (
            <div className="h-32 flex flex-col items-center justify-center border border-dashed border-[#3E424B] rounded text-center p-4">
              <AlertCircle size={24} className="text-[#6E727A]" />
              <p className="text-xs text-[#6E727A] mt-2">No upcoming schedule items</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
