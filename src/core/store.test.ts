import { describe, expect, it, vi } from 'vitest';
import { AppStore } from './store';

class MemoryStorage implements Storage {
  private data = new Map<string, string>();
  get length() { return this.data.size; }
  clear() { this.data.clear(); }
  getItem(key: string) { return this.data.get(key) ?? null; }
  key(index: number) { return [...this.data.keys()][index] ?? null; }
  removeItem(key: string) { this.data.delete(key); }
  setItem(key: string, value: string) { this.data.set(key, value); }
}

describe('AppStore', () => {
  it('persists, hydrates, updates and removes typed entities', () => {
    const storage = new MemoryStorage();
    const store = new AppStore('tracker', storage);
    const listener = vi.fn();
    store.subscribe(listener);

    store.upsert('tasks', {
      id: 'task-1', title: 'Pay bill', notes: '', due_date: '2026-07-14', due_time: '19:00',
      status: 'pending', source_capture_id: null, completed_at: null, reminder_sent_at: null,
      created_at: '2026-07-13T00:00:00Z'
    });

    const restored = new AppStore('tracker', storage);
    restored.hydrate();
    expect(restored.state.tasks[0].title).toBe('Pay bill');
    expect(listener).toHaveBeenCalledOnce();

    restored.remove('tasks', 'task-1');
    expect(restored.state.tasks).toEqual([]);
  });
});
