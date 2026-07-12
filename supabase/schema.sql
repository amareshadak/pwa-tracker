-- =========================================================
-- Daily Tracker — Supabase schema (run in SQL Editor)
-- Simple multi-user (5–10 users) with row-level security
-- =========================================================

create table if not exists habits (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  icon text default '✅',
  type text not null default 'yesno' check (type in ('yesno','quantity','duration')),
  target numeric default 1,
  unit text default '',
  reminder_time text default '20:00',   -- 'HH:MM' 24h
  schedule jsonb default '[]',          -- [] = daily, else weekday numbers 0-6
  archived boolean default false,
  created_at timestamptz default now()
);

create table if not exists habit_logs (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  habit_id uuid not null references habits(id) on delete cascade,
  date date not null,
  value numeric default 0,
  completed boolean default false,
  unique (habit_id, date)
);

create table if not exists accounts (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  type text default 'bank' check (type in ('bank','cash','upi')),
  icon text default '🏦'
);

create table if not exists categories (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  icon text default '📦',
  color text default '#6366f1',
  monthly_budget numeric default 0
);

create table if not exists expenses (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  amount numeric not null,
  account_id uuid references accounts(id) on delete set null,
  category_id uuid references categories(id) on delete set null,
  note text default '',
  date date not null,
  created_at timestamptz default now()
);

create table if not exists recurring (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  note text not null,
  amount numeric not null,
  day int not null default 1 check (day between 1 and 28),
  account_id uuid references accounts(id) on delete set null,
  category_id uuid references categories(id) on delete set null,
  last_posted text default ''   -- 'YYYY-MM' of last auto-post
);

create table if not exists captures (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  raw_text text not null,
  ai_type text,          -- 'habit' | 'expense' | 'reminder' | 'note', set by parse-capture (best-effort)
  ai_summary text,
  status text not null default 'inbox' check (status in ('inbox','done','dismissed')),
  created_at timestamptz default now()
);

create table if not exists push_subs (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  subscription jsonb not null,
  endpoint text not null,               -- subscription->>'endpoint', kept as a real column so
                                         -- upsert(onConflict: 'user_id,endpoint') can dedupe re-subscribes
  created_at timestamptz default now(),
  unique (user_id, endpoint)
);

-- ---------- Row Level Security: each user sees only their own rows ----------
alter table habits enable row level security;
alter table habit_logs enable row level security;
alter table accounts enable row level security;
alter table categories enable row level security;
alter table expenses enable row level security;
alter table recurring enable row level security;
alter table push_subs enable row level security;
alter table captures enable row level security;

do $$
declare t text;
begin
  foreach t in array array['habits','habit_logs','accounts','categories','expenses','recurring','push_subs','captures'] loop
    execute format('drop policy if exists "own rows" on %I', t);
    execute format(
      'create policy "own rows" on %I for all using (user_id = auth.uid()) with check (user_id = auth.uid())', t);
  end loop;
end $$;

-- Helpful indexes
create index if not exists idx_habit_logs_user_date on habit_logs (user_id, date);
create index if not exists idx_expenses_user_date on expenses (user_id, date);
create index if not exists idx_captures_user_status on captures (user_id, status);
