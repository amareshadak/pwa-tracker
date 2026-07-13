alter table public.captures
  add column if not exists ai_data jsonb default '{}'::jsonb;

create table if not exists public.tasks (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null,
  notes text default '',
  due_date date,
  due_time text,
  status text not null default 'pending' check (status in ('pending','completed','dismissed')),
  source_capture_id uuid references public.captures(id) on delete set null,
  completed_at timestamptz,
  reminder_sent_at timestamptz,
  created_at timestamptz default now()
);

alter table public.tasks enable row level security;
drop policy if exists "own rows" on public.tasks;
create policy "own rows" on public.tasks for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create index if not exists idx_tasks_user_due
  on public.tasks (user_id, status, due_date, due_time);
