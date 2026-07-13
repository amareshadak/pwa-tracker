import type { SupabaseClient, User } from '@supabase/supabase-js';
import type { AppState, EntityTable, SyncOperation } from './types';
import { AppStore } from './store';

const TABLES: EntityTable[] = ['habits', 'habit_logs', 'accounts', 'categories', 'expenses', 'recurring', 'captures', 'tasks'];

export class SyncEngine {
  constructor(
    private readonly client: SupabaseClient,
    private readonly store: AppStore,
    private readonly getUser: () => User | null,
    private readonly queueKey = 'dailytracker_queue',
    private readonly storage: Storage = localStorage
  ) {}

  enqueue(operation: SyncOperation): void {
    const queue = this.readQueue();
    queue.push(operation);
    this.writeQueue(queue);
    void this.flush();
  }

  async flush(): Promise<void> {
    const user = this.getUser();
    if (!user || !navigator.onLine) return;
    const queue = this.readQueue();
    while (queue.length) {
      const operation = queue[0];
      try {
        if (operation.type === 'upsert' && operation.row) {
          const { error } = await this.client.from(operation.table).upsert({ ...operation.row, user_id: user.id });
          if (error) throw error;
        } else if (operation.type === 'delete' && operation.id) {
          const { error } = await this.client.from(operation.table).delete().eq('id', operation.id);
          if (error) throw error;
        }
        queue.shift();
        this.writeQueue(queue);
      } catch (error) {
        console.warn('Sync paused; operation remains queued', error);
        break;
      }
    }
  }

  async pull(): Promise<void> {
    if (!this.getUser()) return;
    const results = await Promise.all(TABLES.map(table => this.client.from(table).select('*')));
    const failed = results.find(result => result.error);
    if (failed?.error) throw failed.error;
    const remote = Object.fromEntries(TABLES.map((table, index) => [table, results[index].data || []])) as Pick<AppState, EntityTable>;
    if (remote.habits.length || remote.accounts.length || remote.categories.length || !this.store.state.habits.length) {
      for (const table of TABLES) (this.store.state as any)[table] = remote[table];
      this.store.persist();
    }
  }

  pendingCount(): number { return this.readQueue().length; }
  clear(): void { this.storage.removeItem(this.queueKey); }

  private readQueue(): SyncOperation[] {
    try { return JSON.parse(this.storage.getItem(this.queueKey) || '[]') as SyncOperation[]; }
    catch { return []; }
  }

  private writeQueue(queue: SyncOperation[]): void {
    this.storage.setItem(this.queueKey, JSON.stringify(queue));
  }
}
