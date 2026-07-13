export type UUID = string;
export type ISODate = string;
export type Time24 = string;

export interface Habit {
  id: UUID;
  name: string;
  icon: string;
  type: 'yesno' | 'quantity' | 'duration';
  target: number;
  unit: string;
  reminder_time: Time24;
  schedule: number[];
  archived: boolean;
}

export interface HabitLog {
  id: UUID;
  habit_id: UUID;
  date: ISODate;
  value: number;
  completed: boolean;
}

export interface Account {
  id: UUID;
  name: string;
  type: 'bank' | 'cash' | 'upi';
  icon: string;
}

export interface Category {
  id: UUID;
  name: string;
  icon: string;
  color: string;
  monthly_budget: number;
}

export interface Expense {
  id: UUID;
  amount: number;
  account_id: UUID | null;
  category_id: UUID | null;
  note: string;
  date: ISODate;
}

export interface RecurringExpense {
  id: UUID;
  note: string;
  amount: number;
  day: number;
  account_id: UUID | null;
  category_id: UUID | null;
  last_posted: string;
}

export interface CaptureSuggestion {
  type?: 'habit' | 'expense' | 'reminder' | 'note';
  summary?: string;
  due_date?: ISODate | null;
  due_time?: Time24 | null;
  amount?: number | null;
  habit_type?: Habit['type'] | null;
  target?: number | null;
  unit?: string | null;
}

export interface Capture {
  id: UUID;
  raw_text: string;
  ai_type: CaptureSuggestion['type'] | null;
  ai_summary: string | null;
  ai_data?: CaptureSuggestion;
  status: 'inbox' | 'done' | 'dismissed';
  created_at: string;
}

export interface Task {
  id: UUID;
  title: string;
  notes: string;
  due_date: ISODate | null;
  due_time: Time24 | null;
  status: 'pending' | 'completed' | 'dismissed';
  source_capture_id: UUID | null;
  completed_at: string | null;
  reminder_sent_at: string | null;
  created_at: string;
}

export interface Settings {
  theme?: 'auto' | 'light' | 'dark';
  pin?: string | null;
}

export interface AppState {
  habits: Habit[];
  habit_logs: HabitLog[];
  accounts: Account[];
  categories: Category[];
  expenses: Expense[];
  recurring: RecurringExpense[];
  captures: Capture[];
  tasks: Task[];
  settings: Settings;
}

export type EntityTable = Exclude<keyof AppState, 'settings'>;

export interface SyncOperation {
  table: EntityTable;
  type: 'upsert' | 'delete';
  row?: Record<string, unknown>;
  id?: UUID;
}
