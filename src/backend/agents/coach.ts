import { readDb } from '../services/dbService';

export interface PerformanceReport {
  score: number; // percentage
  streak: number;
  totalFocusedMinutes: number;
  completionRate: number;
  advice: string;
}

/**
 * Coach agent calculations for user performance metrics and productivity counseling.
 */
export function generateCoachReport(): PerformanceReport {
  const db = readDb();
  
  const tasks = db.tasks || [];
  const focusLogs = db.focusLogs || [];
  const metrics = db.metrics || { streak: 0, totalFocusMinutes: 0, averageFocusScore: 0, averageDistractions: 0 };

  // Calculate task completion rate
  const completedCount = tasks.filter(t => t.status === 'completed').length;
  const totalTasks = tasks.length;
  const completionRate = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 100;

  // Calculate focus performance coefficient (scale of 0 to 100)
  // Combination of: completion rate, focus rating out of 5, and penalties for distractions
  let avgRating = metrics.averageFocusScore || 0;
  let avgDistractions = metrics.averageDistractions || 0;

  if (focusLogs.length > 0) {
    avgRating = parseFloat((focusLogs.reduce((sum, l) => sum + (l.rating || 0), 0) / focusLogs.length).toFixed(2));
    avgDistractions = parseFloat((focusLogs.reduce((sum, l) => sum + (l.distractions || 0), 0) / focusLogs.length).toFixed(2));
  }

  const ratingComponent = (avgRating / 5) * 50; // Max 50 points
  const completionComponent = (completionRate / 100) * 30; // Max 30 points
  const distractionPenalty = Math.max(0, 20 - (avgDistractions * 5)); // Max 20 points, minus 5 points per distraction

  const score = Math.round(ratingComponent + completionComponent + distractionPenalty);

  // Coaching Advice Engine
  let advice = '';
  if (score >= 85) {
    advice = 'Sensational deep work alignment! Your distraction coefficient is incredibly low, and you are completing almost all planned sprints. Maintain this rhythm!';
  } else if (score >= 60) {
    advice = 'Decent productivity trajectory, but look to isolate workspace distractions. Scheduling shorter, 25-minute Pomodoro sprints might raise your completion rate.';
  } else {
    advice = 'Low stamina score detected. Let us reset by choosing just ONE high-priority task, reducing distractions entirely, and logging a short 15-minute success session first.';
  }

  return {
    score: Math.min(100, Math.max(0, score)),
    streak: metrics.streak,
    totalFocusedMinutes: metrics.totalFocusMinutes,
    completionRate,
    advice
  };
}
