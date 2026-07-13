import type { AppState, EntityTable, UUID } from './types';

const EMPTY_STATE: AppState = {
  habits: [],
  habit_logs: [],
  accounts: [],
  categories: [],
  expenses: [],
  recurring: [],
  captures: [],
  tasks: [],
  settings: {}
};

type Listener = (state: Readonly<AppState>) => void;

export class AppStore {
  readonly state: AppState = structuredClone(EMPTY_STATE);
  private readonly listeners = new Set<Listener>();

  constructor(
    private readonly storageKey: string,
    private readonly storage: Storage = localStorage
  ) {}

  hydrate(): void {
    try {
      const raw = this.storage.getItem(this.storageKey);
      if (!raw) return;
      const saved = JSON.parse(raw) as Partial<AppState>;
      for (const key of Object.keys(EMPTY_STATE) as Array<keyof AppState>) {
        const value = saved[key];
        if (value !== undefined) (this.state as any)[key] = value;
      }
      this.emit();
    } catch (error) {
      console.warn('Ignoring invalid local tracker state', error);
    }
  }

  persist(): void {
    this.storage.setItem(this.storageKey, JSON.stringify(this.state));
  }

  replaceEntities(next: Pick<AppState, EntityTable>): void {
    for (const table of Object.keys(next) as EntityTable[]) {
      this.state[table] = next[table] as never;
    }
    this.commit();
  }

  upsert<T extends EntityTable>(table: T, row: AppState[T][number]): void {
    const rows = this.state[table] as Array<{ id: UUID }>;
    const index = rows.findIndex(item => item.id === (row as { id: UUID }).id);
    if (index >= 0) rows[index] = row as { id: UUID };
    else rows.push(row as { id: UUID });
    this.commit();
  }

  remove(table: EntityTable, id: UUID): void {
    (this.state as any)[table] = (this.state[table] as Array<{ id: UUID }>).filter(row => row.id !== id);
    this.commit();
  }

  updateSettings(patch: Partial<AppState['settings']>): void {
    Object.assign(this.state.settings, patch);
    this.commit();
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  clear(): void {
    this.storage.removeItem(this.storageKey);
    Object.assign(this.state, structuredClone(EMPTY_STATE));
    this.emit();
  }

  private commit(): void {
    this.persist();
    this.emit();
  }

  private emit(): void {
    for (const listener of this.listeners) listener(this.state);
  }
}
