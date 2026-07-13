import { describe, expect, it } from 'vitest';
import type { Task } from '../../core/types';
import { filterAndSortTasks, isTaskOverdue } from './model';

const task = (patch: Partial<Task>): Task => ({
  id: '1', title: 'Task', notes: '', due_date: null, due_time: null, status: 'pending',
  source_capture_id: null, completed_at: null, reminder_sent_at: null, created_at: '', ...patch
});

describe('task model', () => {
  it('filters by status and orders scheduled tasks before unscheduled tasks', () => {
    const result = filterAndSortTasks([
      task({ id: 'none' }),
      task({ id: 'later', due_date: '2026-07-15', due_time: '08:00' }),
      task({ id: 'done', status: 'completed', due_date: '2026-07-13' }),
      task({ id: 'first', due_date: '2026-07-14', due_time: '19:00' })
    ], 'pending');
    expect(result.map(item => item.id)).toEqual(['first', 'later', 'none']);
  });

  it('marks only pending past tasks overdue', () => {
    expect(isTaskOverdue(task({ due_date: '2026-07-13', due_time: '18:00' }), '2026-07-13 19:00')).toBe(true);
    expect(isTaskOverdue(task({ status: 'completed', due_date: '2026-07-13' }), '2026-07-14 19:00')).toBe(false);
  });
});
