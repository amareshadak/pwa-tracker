import type { Task } from '../../core/types';

export type TaskFilter = 'pending' | 'completed' | 'all';

export function taskDueKey(task: Task): string {
  return `${task.due_date || '9999-12-31'} ${task.due_time || '99:99'}`;
}

export function filterAndSortTasks(tasks: Task[], filter: TaskFilter): Task[] {
  return tasks
    .filter(task => filter === 'all' || task.status === filter)
    .sort((a, b) => taskDueKey(a).localeCompare(taskDueKey(b)));
}

export function isTaskOverdue(task: Task, nowKey: string): boolean {
  return task.status === 'pending' && Boolean(task.due_date) && `${task.due_date} ${task.due_time || '23:59'}` < nowKey;
}
