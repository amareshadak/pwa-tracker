import type { Habit, HabitLog } from '../../core/types';
import { todayString } from '../../core/dates';

export function isHabitScheduled(habit: Habit, date: Date): boolean {
  return habit.schedule.length === 0 || habit.schedule.includes(date.getDay());
}

export function findHabitLog(logs: HabitLog[], habitId: string, date: string): HabitLog | undefined {
  return logs.find(log => log.habit_id === habitId && log.date === date);
}

export function habitStreaks(habit: Habit, logs: HabitLog[], now = new Date()): { current: number; best: number } {
  let best = 0;
  let run = 0;
  for (let offset = 365; offset >= 0; offset--) {
    const date = new Date(now);
    date.setDate(now.getDate() - offset);
    if (!isHabitScheduled(habit, date)) continue;
    const complete = findHabitLog(logs, habit.id, todayString(date))?.completed === true;
    run = complete ? run + 1 : 0;
    best = Math.max(best, run);
  }

  let current = 0;
  for (let offset = 0; offset <= 365; offset++) {
    const date = new Date(now);
    date.setDate(now.getDate() - offset);
    if (!isHabitScheduled(habit, date)) continue;
    if (findHabitLog(logs, habit.id, todayString(date))?.completed) current++;
    else if (offset !== 0) break;
  }
  return { current, best };
}

export function habitCompletion(habit: Habit, logs: HabitLog[], days: number, now = new Date()): number {
  let scheduled = 0;
  let completed = 0;
  for (let offset = 0; offset < days; offset++) {
    const date = new Date(now);
    date.setDate(now.getDate() - offset);
    if (!isHabitScheduled(habit, date)) continue;
    scheduled++;
    if (findHabitLog(logs, habit.id, todayString(date))?.completed) completed++;
  }
  return scheduled ? Math.round((completed / scheduled) * 100) : 0;
}
