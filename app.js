/* ============================================================
   Daily Tracker — habits + expenses PWA
   Local-first (localStorage) with optional Supabase sync + push
   ============================================================ */
'use strict';

/* ---------- helpers ---------- */
const $ = (id) => document.getElementById(id);
const uuid = () => (crypto.randomUUID ? crypto.randomUUID() :
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  }));
const todayStr = (d = new Date()) => {
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
};
const fmtMoney = (n) => '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });
const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d; };
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function toast(msg) {
  const t = $('toast'); t.textContent = msg; t.classList.remove('hidden');
  clearTimeout(t._h); t._h = setTimeout(() => t.classList.add('hidden'), 2200);
}

/* ---------- confetti ---------- */
function confetti() {
  const cv = $('confetti'), ctx = cv.getContext('2d');
  cv.width = innerWidth; cv.height = innerHeight;
  const colors = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];
  const parts = Array.from({ length: 90 }, () => ({
    x: Math.random() * cv.width, y: -20 - Math.random() * cv.height * 0.4,
    vx: (Math.random() - .5) * 3, vy: 2 + Math.random() * 4,
    s: 5 + Math.random() * 6, r: Math.random() * Math.PI,
    c: colors[Math.random() * colors.length | 0]
  }));
  let frames = 0;
  (function tick() {
    ctx.clearRect(0, 0, cv.width, cv.height);
    parts.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.r += 0.1;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r);
      ctx.fillStyle = p.c; ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s); ctx.restore();
    });
    if (++frames < 130) requestAnimationFrame(tick);
    else ctx.clearRect(0, 0, cv.width, cv.height);
  })();
}

/* ---------- seed data (PRD defaults) ---------- */
const SEED_ACCOUNTS = [
  { name: 'Bank 1', type: 'bank', icon: '🏦' },
  { name: 'Bank 2', type: 'bank', icon: '🏦' },
  { name: 'Bank 3', type: 'bank', icon: '🏦' },
  { name: 'Cash', type: 'cash', icon: '💵' }
];
const SEED_CATEGORIES = [
  { name: 'Home & Utilities', icon: '🏠', color: '#6366f1', monthly_budget: 0 },
  { name: 'Grocery', icon: '🛒', color: '#10b981', monthly_budget: 0 },
  { name: 'Food & Dining', icon: '🍽️', color: '#f59e0b', monthly_budget: 0 },
  { name: 'Transport', icon: '🚗', color: '#3b82f6', monthly_budget: 0 },
  { name: 'Shopping', icon: '🛍️', color: '#ec4899', monthly_budget: 0 },
  { name: 'Personal Use', icon: '🧴', color: '#8b5cf6', monthly_budget: 0 },
  { name: 'Subscriptions', icon: '📺', color: '#ef4444', monthly_budget: 0 },
  { name: 'Online Payments', icon: '💳', color: '#06b6d4', monthly_budget: 0 },
  { name: 'Given to Someone', icon: '🤝', color: '#f97316', monthly_budget: 0 },
  { name: 'Health', icon: '💊', color: '#84cc16', monthly_budget: 0 },
  { name: 'Entertainment', icon: '🎬', color: '#a855f7', monthly_budget: 0 },
  { name: 'Education', icon: '📚', color: '#0ea5e9', monthly_budget: 0 },
  { name: 'Bills & EMI', icon: '🧾', color: '#64748b', monthly_budget: 0 },
  { name: 'Travel', icon: '✈️', color: '#14b8a6', monthly_budget: 0 },
  { name: 'Others', icon: '📦', color: '#9ca3af', monthly_budget: 0 }
];
const SEED_HABITS = [
  { name: 'Wake up early', icon: '🌅', type: 'yesno', target: 1, unit: '', reminder_time: '06:00', schedule: [] },
  { name: 'Exercise / walk', icon: '🏃', type: 'duration', target: 30, unit: 'min', reminder_time: '07:00', schedule: [] },
  { name: 'Drink water', icon: '💧', type: 'quantity', target: 8, unit: 'glasses', reminder_time: '12:00', schedule: [] },
  { name: 'Journal / plan day', icon: '📝', type: 'yesno', target: 1, unit: '', reminder_time: '09:00', schedule: [] },
  { name: 'No junk food', icon: '🍔', type: 'yesno', target: 1, unit: '', reminder_time: '20:00', schedule: [] },
  { name: 'Read', icon: '📖', type: 'duration', target: 20, unit: 'min', reminder_time: '21:30', schedule: [] },
  { name: 'Meditate', icon: '🧘', type: 'duration', target: 10, unit: 'min', reminder_time: '22:00', schedule: [] },
  { name: 'Sleep by 11 PM', icon: '😴', type: 'yesno', target: 1, unit: '', reminder_time: '22:45', schedule: [] }
];
const EMOJIS = ['✅','🌅','🏃','💧','📝','🍔','📖','🧘','😴','💪','🚭','🙏','🎯','🎨','🎸','💻','🧹','🌿','☀️','❤️'];
const CAT_EMOJIS = ['🏠','🛒','🍽️','🚗','🛍️','🧴','📺','💳','🤝','💊','🎬','📚','🧾','✈️','📦','🎁','⚽','🐕','👶','💼'];
const ACC_EMOJIS = ['🏦','💵','📱','💳','👛'];

/* ---------- state ---------- */
let S = { habits: [], habit_logs: [], accounts: [], categories: [], expenses: [], recurring: [], settings: {} };
let sb = null;          // supabase client
let sessionUser = null; // supabase user
let currentView = 'today';
let expenseRange = 'week';
let charts = {};

const LS_KEY = 'dailytracker_v1';
const QUEUE_KEY = 'dailytracker_queue';

function saveLocal() { localStorage.setItem(LS_KEY, JSON.stringify(S)); }
function loadLocal() {
  try { const raw = localStorage.getItem(LS_KEY); if (raw) S = Object.assign(S, JSON.parse(raw)); } catch (_) {}
}

/* ---------- sync (Supabase, optional) ---------- */
const cfg = window.APP_CONFIG || {};
const hasSupabase = !!(cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY);

function queue(op) { // op: {table, type:'upsert'|'delete', row|id}
  const q = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
  q.push(op); localStorage.setItem(QUEUE_KEY, JSON.stringify(q));
  flushQueue();
}
async function flushQueue() {
  if (!sb || !sessionUser || !navigator.onLine) return;
  let q = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
  while (q.length) {
    const op = q[0];
    try {
      if (op.type === 'upsert') {
        const row = Object.assign({}, op.row, { user_id: sessionUser.id });
        const { error } = await sb.from(op.table).upsert(row);
        if (error) throw error;
      } else if (op.type === 'delete') {
        const { error } = await sb.from(op.table).delete().eq('id', op.id);
        if (error) throw error;
      }
      q.shift(); localStorage.setItem(QUEUE_KEY, JSON.stringify(q));
    } catch (e) { console.warn('sync retry later', e.message || e); break; }
  }
  updateSyncStatus();
}
async function pullAll() {
  if (!sb || !sessionUser) return;
  try {
    const tables = ['habits', 'habit_logs', 'accounts', 'categories', 'expenses', 'recurring'];
    const results = await Promise.all(tables.map(t => sb.from(t).select('*')));
    if (results.some(r => r.error)) throw results.find(r => r.error).error;
    const [h, hl, a, c, e, rec] = results.map(r => r.data);
    // only replace if server actually has data OR local empty
    if (h.length || a.length || c.length || !S.habits.length) {
      S.habits = h; S.habit_logs = hl; S.accounts = a; S.categories = c; S.expenses = e; S.recurring = rec;
    }
    saveLocal();
  } catch (e) { console.warn('pull failed', e.message || e); }
}
function updateSyncStatus() {
  const el = $('syncStatus'); if (!el) return;
  if (!hasSupabase) { el.textContent = 'Local-only mode. Add Supabase keys in config.js to enable sync + push.'; return; }
  const pending = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]').length;
  el.textContent = sessionUser
    ? (pending ? `☁️ Synced (${pending} pending)` : '☁️ Synced with Supabase')
    : 'Not signed in';
}

/* mutation helpers: write local + queue remote */
function upsert(table, row) {
  const arr = S[table];
  const i = arr.findIndex(r => r.id === row.id);
  if (i >= 0) arr[i] = row; else arr.push(row);
  saveLocal();
  if (hasSupabase) queue({ table, type: 'upsert', row });
}
function removeRow(table, id) {
  S[table] = S[table].filter(r => r.id !== id);
  saveLocal();
  if (hasSupabase) queue({ table, type: 'delete', id });
}

/* ---------- seeding ---------- */
function seedIfEmpty() {
  if (!S.accounts.length) SEED_ACCOUNTS.forEach(a => upsert('accounts', Object.assign({ id: uuid() }, a)));
  if (!S.categories.length) SEED_CATEGORIES.forEach(c => upsert('categories', Object.assign({ id: uuid() }, c)));
  if (!S.habits.length) SEED_HABITS.forEach(h => upsert('habits', Object.assign({ id: uuid(), archived: false }, h)));
}

/* ---------- habit logic ---------- */
function isScheduled(habit, date) {
  const sch = habit.schedule || [];
  if (!sch.length) return true; // daily
  return sch.includes(date.getDay());
}
function logFor(habitId, dateStr) {
  return S.habit_logs.find(l => l.habit_id === habitId && l.date === dateStr);
}
function setLog(habit, dateStr, value) {
  let log = logFor(habit.id, dateStr);
  const completed = value >= (habit.type === 'yesno' ? 1 : habit.target);
  if (!log) log = { id: uuid(), habit_id: habit.id, date: dateStr, value, completed };
  else { log = Object.assign({}, log, { value, completed }); }
  upsert('habit_logs', log);
  return log;
}
function streaks(habit) {
  let cur = 0, best = 0, run = 0;
  // walk back 365 days
  for (let i = 0; i <= 365; i++) {
    const d = daysAgo(i), ds = todayStr(d);
    if (!isScheduled(habit, d)) continue;
    const log = logFor(habit.id, ds);
    const done = log && log.completed;
    if (done) { run++; if (run > best) best = run; }
    else { if (i === 0) { /* today not done yet — don't break */ } else run = 0; }
    if (i === 0) cur = run;
  }
  // current streak = consecutive from today/yesterday backwards
  cur = 0;
  for (let i = 0; i <= 365; i++) {
    const d = daysAgo(i), ds = todayStr(d);
    if (!isScheduled(habit, d)) continue;
    const log = logFor(habit.id, ds);
    if (log && log.completed) cur++;
    else { if (i === 0) continue; break; }
  }
  return { cur, best };
}
function completionPct(habit, days) {
  let sched = 0, done = 0;
  for (let i = 0; i < days; i++) {
    const d = daysAgo(i);
    if (!isScheduled(habit, d)) continue;
    sched++;
    const log = logFor(habit.id, todayStr(d));
    if (log && log.completed) done++;
  }
  return sched ? Math.round(done / sched * 100) : 0;
}

/* ---------- views ---------- */
function switchView(v) {
  currentView = v;
  document.querySelectorAll('.view').forEach(el => el.classList.add('hidden'));
  $('view-' + v).classList.remove('hidden');
  document.querySelectorAll('.tabbar button').forEach(b => b.classList.toggle('on', b.dataset.view === v));
  render();
}

function render() {
  $('todayDate').textContent = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
  const hour = new Date().getHours();
  $('greeting').textContent = hour < 12 ? 'Good morning! ☀️' : hour < 17 ? 'Good afternoon! 🌤️' : 'Good evening! 🌙';
  if (currentView === 'today') renderToday();
  if (currentView === 'habits') renderHabits();
  if (currentView === 'expenses') renderExpenses();
  if (currentView === 'settings') renderSettings();
  renderStreakBadge();
}

function renderStreakBadge() {
  const active = S.habits.filter(h => !h.archived);
  const maxCur = active.length ? Math.max(...active.map(h => streaks(h).cur)) : 0;
  $('streakBadge').textContent = `🔥 ${maxCur}`;
}

/* ----- TODAY ----- */
let qeSelAccount = null, qeSelCategory = null;

function renderToday() {
  const ds = todayStr();
  const todays = S.habits.filter(h => !h.archived && isScheduled(h, new Date()));
  const doneCount = todays.filter(h => { const l = logFor(h.id, ds); return l && l.completed; }).length;
  $('sumHabits').textContent = `${doneCount}/${todays.length}`;
  const todayExp = S.expenses.filter(e => e.date === ds);
  $('sumSpend').textContent = fmtMoney(todayExp.reduce((s, e) => s + Number(e.amount), 0));

  // habit checklist
  const wrap = $('todayHabits'); wrap.innerHTML = '';
  todays.forEach(h => {
    const log = logFor(h.id, ds);
    const val = log ? log.value : 0;
    const done = log && log.completed;
    const row = document.createElement('div');
    row.className = 'habit-row' + (done ? ' done' : '');
    const sub = h.type === 'yesno' ? (h.reminder_time ? '⏰ ' + h.reminder_time : '') :
      `${val}/${h.target} ${h.unit} · ⏰ ${h.reminder_time || ''}`;
    row.innerHTML = `<div class="habit-emoji">${h.icon}</div>
      <div class="habit-info"><div class="habit-name">${h.name}</div><div class="habit-sub">${sub}</div></div>`;
    if (h.type === 'yesno') {
      const btn = document.createElement('button');
      btn.className = 'habit-check' + (done ? ' on' : '');
      btn.textContent = done ? '✓' : '';
      btn.onclick = () => {
        const newVal = done ? 0 : 1;
        setLog(h, ds, newVal);
        if (newVal) { celebrate(h); }
        render();
      };
      row.appendChild(btn);
    } else {
      const ctr = document.createElement('div'); ctr.className = 'qty-controls';
      const minus = document.createElement('button'); minus.className = 'minus'; minus.textContent = '−';
      const valEl = document.createElement('div'); valEl.className = 'qty-val'; valEl.textContent = `${val}`;
      const plus = document.createElement('button'); plus.textContent = '+';
      const step = h.type === 'duration' ? 5 : 1;
      minus.onclick = () => { setLog(h, ds, Math.max(0, val - step)); render(); };
      plus.onclick = () => {
        const nv = val + step; const wasDone = done;
        setLog(h, ds, nv);
        if (!wasDone && nv >= h.target) celebrate(h);
        render();
      };
      ctr.append(minus, valEl, plus); row.appendChild(ctr);
    }
    wrap.appendChild(row);
  });
  if (!todays.length) wrap.innerHTML = '<p class="muted center">No habits scheduled today 🎉</p>';

  renderQuickExpense();
  if (!$('qeDate').value) $('qeDate').value = ds;
  renderExpenseList($('todayExpenses'), todayExp);
}

/* ----- recurring expenses: auto-post monthly ----- */
function postRecurring() {
  const now = new Date();
  const m = todayStr().slice(0, 7);
  S.recurring.forEach(r => {
    if (r.last_posted === m || now.getDate() < r.day) return;
    const dd = String(Math.min(r.day, 28)).padStart(2, '0');
    upsert('expenses', {
      id: uuid(), amount: r.amount, account_id: r.account_id, category_id: r.category_id,
      note: (r.note || 'Recurring') + ' 🔁', date: `${m}-${dd}`
    });
    upsert('recurring', Object.assign({}, r, { last_posted: m }));
    toast(`🔁 ${r.note || 'Recurring'}: ${fmtMoney(r.amount)} added`);
  });
}

function celebrate(h) {
  const { cur } = streaks(h);
  const streak = cur + 1;
  if (streak >= 3 && (streak % 5 === 0 || streak === 3 || streak === 7)) {
    confetti(); toast(`${h.icon} ${streak} days strong! 🔥`);
  } else {
    toast(`${h.icon} Done! Nice one 💪`);
    if (streak >= 2) { /* small joy anyway */ }
  }
}

function renderQuickExpense() {
  const accWrap = $('qeAccounts'); accWrap.innerHTML = '';
  if (!qeSelAccount && S.accounts.length) qeSelAccount = S.accounts[0].id;
  S.accounts.forEach(a => {
    const c = document.createElement('button');
    c.className = 'chip' + (qeSelAccount === a.id ? ' on' : '');
    c.textContent = `${a.icon} ${a.name}`;
    c.onclick = () => { qeSelAccount = a.id; renderQuickExpense(); };
    accWrap.appendChild(c);
  });
  const catWrap = $('qeCategories'); catWrap.innerHTML = '';
  S.categories.forEach(cat => {
    const c = document.createElement('div');
    c.className = 'cat-cell' + (qeSelCategory === cat.id ? ' on' : '');
    c.innerHTML = `<span>${cat.icon}</span>${cat.name}`;
    c.onclick = () => { qeSelCategory = cat.id; renderQuickExpense(); };
    catWrap.appendChild(c);
  });
}

function saveQuickExpense() {
  const amt = parseFloat($('qeAmount').value);
  if (!amt || amt <= 0) { toast('Enter an amount 🙂'); return; }
  if (!qeSelCategory) { toast('Pick a category'); return; }
  const exp = {
    id: uuid(), amount: amt, account_id: qeSelAccount, category_id: qeSelCategory,
    note: $('qeNote').value.trim(), date: $('qeDate').value || todayStr()
  };
  upsert('expenses', exp);
  $('qeAmount').value = ''; $('qeNote').value = ''; $('qeDate').value = todayStr(); qeSelCategory = null;
  toast(`💸 ${fmtMoney(amt)} added`);
  checkBudget(exp.category_id);
  render();
}

function checkBudget(catId) {
  const cat = S.categories.find(c => c.id === catId);
  if (!cat || !cat.monthly_budget) return;
  const m = todayStr().slice(0, 7);
  const spent = S.expenses.filter(e => e.category_id === catId && e.date.startsWith(m))
    .reduce((s, e) => s + Number(e.amount), 0);
  const pct = spent / cat.monthly_budget * 100;
  if (pct >= 100) toast(`⚠️ ${cat.icon} ${cat.name} budget exceeded! (${fmtMoney(spent)})`);
  else if (pct >= 80) toast(`⚠️ ${cat.icon} ${cat.name}: ${Math.round(pct)}% of budget used`);
}

function renderExpenseList(container, expenses) {
  container.innerHTML = '';
  const sorted = [...expenses].sort((a, b) => b.date.localeCompare(a.date));
  sorted.forEach(e => {
    const cat = S.categories.find(c => c.id === e.category_id) || { icon: '📦', name: '?' };
    const acc = S.accounts.find(a => a.id === e.account_id) || { name: '' };
    const row = document.createElement('div'); row.className = 'exp-row';
    row.innerHTML = `<div class="exp-emoji">${cat.icon}</div>
      <div class="exp-info"><div class="exp-cat">${cat.name}</div>
      <div class="exp-note">${e.date} · ${acc.name}${e.note ? ' · ' + e.note : ''}</div></div>
      <div class="exp-amt">${fmtMoney(e.amount)}</div>`;
    const del = document.createElement('button'); del.className = 'exp-del'; del.textContent = '✕';
    del.onclick = () => { if (confirm('Delete this expense?')) { removeRow('expenses', e.id); render(); } };
    row.appendChild(del);
    container.appendChild(row);
  });
  if (!sorted.length) container.innerHTML = '<p class="muted center small">Nothing here yet</p>';
}

/* ----- HABITS PAGE ----- */
function renderHabits() {
  const wrap = $('habitCards'); wrap.innerHTML = '';
  $('habitDetail').classList.add('hidden'); wrap.classList.remove('hidden');
  $('weekdayCard').classList.remove('hidden');

  // weak-days chart: completion % by weekday over last 30 days
  const sched = [0,0,0,0,0,0,0], done = [0,0,0,0,0,0,0];
  const active = S.habits.filter(h => !h.archived);
  for (let i = 0; i < 30; i++) {
    const d = daysAgo(i), ds = todayStr(d), dow = d.getDay();
    active.forEach(h => {
      if (!isScheduled(h, d)) return;
      sched[dow]++;
      const log = logFor(h.id, ds);
      if (log && log.completed) done[dow]++;
    });
  }
  drawChart('chartWeekdays', {
    type: 'bar',
    data: { labels: DOW, datasets: [{
      data: sched.map((s, i) => s ? Math.round(done[i] / s * 100) : 0),
      backgroundColor: sched.map((s, i) => (s && done[i] / s < 0.5) ? '#ef4444' : '#10b981'),
      borderRadius: 6 }] },
    options: { plugins: { legend: { display: false } },
      scales: { y: { max: 100, ticks: { callback: v => v + '%' } } } }
  });
  S.habits.filter(h => !h.archived).forEach(h => {
    const st = streaks(h);
    const card = document.createElement('div'); card.className = 'habit-card';
    card.innerHTML = `<div class="habit-card-top">
        <div class="habit-emoji">${h.icon}</div>
        <div class="habit-info"><div class="habit-name">${h.name}</div>
          <div class="habit-sub">⏰ ${h.reminder_time || 'no reminder'} · ${(h.schedule||[]).length ? (h.schedule.map(d=>DOW[d]).join(' ')) : 'daily'}</div></div>
        <div class="pill">🔥 ${st.cur}</div></div>
      <div class="streak-pills">
        <span class="pill">Best: ${st.best}</span>
        <span class="pill">7d: ${completionPct(h,7)}%</span>
        <span class="pill">30d: ${completionPct(h,30)}%</span>
      </div>`;
    card.onclick = () => showHabitDetail(h);
    wrap.appendChild(card);
  });
}

function showHabitDetail(h) {
  const wrap = $('habitDetail'); const cards = $('habitCards');
  cards.classList.add('hidden'); $('weekdayCard').classList.add('hidden'); wrap.classList.remove('hidden');
  const st = streaks(h);
  // heatmap: last 15 weeks
  let cells = '';
  const weeks = 15;
  const start = new Date(); start.setDate(start.getDate() - (weeks * 7 - 1) - start.getDay());
  for (let c = 0; c < weeks + 1; c++) {
    for (let r = 0; r < 7; r++) {
      const d = new Date(start); d.setDate(start.getDate() + c * 7 + r);
      if (d > new Date()) { cells += '<i style="opacity:0"></i>'; continue; }
      const log = logFor(h.id, todayStr(d));
      let lvl = '';
      if (log && log.value > 0) {
        const ratio = h.type === 'yesno' ? (log.completed ? 1 : 0) : Math.min(1, log.value / h.target);
        lvl = ratio >= 1 ? 'l4' : ratio >= .7 ? 'l3' : ratio >= .4 ? 'l2' : 'l1';
      }
      cells += `<i class="${lvl}" title="${todayStr(d)}"></i>`;
    }
  }
  wrap.innerHTML = `
    <button class="btn-small" id="backToHabits">← Back</button>
    <div class="habit-card" style="margin-top:10px">
      <div class="habit-card-top">
        <div class="habit-emoji">${h.icon}</div>
        <div class="habit-info"><div class="habit-name">${h.name}</div>
        <div class="habit-sub">${h.type === 'yesno' ? 'Yes / No' : `Target: ${h.target} ${h.unit}`} · ⏰ ${h.reminder_time}</div></div>
      </div>
      <div class="streak-pills">
        <span class="pill">🔥 Current: ${st.cur}</span><span class="pill">🏆 Best: ${st.best}</span>
        <span class="pill">30d: ${completionPct(h,30)}%</span>
      </div>
      <div class="heatmap">${cells}</div>
      <div class="modal-actions">
        <button class="btn-primary" id="editHabitBtn">✏️ Edit</button>
        <button class="btn-small danger" id="deleteHabitBtn">Delete</button>
      </div>
    </div>`;
  $('backToHabits').onclick = () => renderHabits();
  $('editHabitBtn').onclick = () => habitModal(h);
  $('deleteHabitBtn').onclick = () => {
    if (confirm(`Delete "${h.name}" and its history?`)) {
      S.habit_logs.filter(l => l.habit_id === h.id).forEach(l => removeRow('habit_logs', l.id));
      removeRow('habits', h.id); renderHabits();
    }
  };
}

/* ----- habit add/edit modal ----- */
function habitModal(h) {
  const isNew = !h;
  h = h || { id: uuid(), name: '', icon: '✅', type: 'yesno', target: 1, unit: '', reminder_time: '20:00', schedule: [], archived: false };
  let selIcon = h.icon, selDays = [...(h.schedule || [])];
  openModal(`
    <h3>${isNew ? 'New habit' : 'Edit habit'}</h3>
    <label>Name</label><input id="mh_name" value="${h.name}" placeholder="e.g. Stretch 10 min">
    <label>Icon</label><div class="emoji-row" id="mh_icons"></div>
    <label>Type</label>
    <select id="mh_type">
      <option value="yesno" ${h.type==='yesno'?'selected':''}>Yes / No</option>
      <option value="quantity" ${h.type==='quantity'?'selected':''}>Quantity (count)</option>
      <option value="duration" ${h.type==='duration'?'selected':''}>Duration (minutes)</option>
    </select>
    <div id="mh_targetWrap" class="${h.type==='yesno'?'hidden':''}">
      <label>Daily target</label><input id="mh_target" type="number" value="${h.target}" min="1">
      <label>Unit</label><input id="mh_unit" value="${h.unit}" placeholder="glasses / min / pages">
    </div>
    <label>Reminder time ⏰</label><input id="mh_time" type="time" value="${h.reminder_time}">
    <label>Days (none selected = every day)</label><div class="day-row" id="mh_days"></div>
    <div class="modal-actions">
      <button class="btn-primary" id="mh_save">Save</button>
      <button class="btn-small" id="mh_cancel">Cancel</button>
    </div>`);
  const iconWrap = $('mh_icons');
  EMOJIS.forEach(em => {
    const b = document.createElement('span'); b.className = 'emoji-opt' + (em === selIcon ? ' on' : ''); b.textContent = em;
    b.onclick = () => { selIcon = em; iconWrap.querySelectorAll('.emoji-opt').forEach(x => x.classList.toggle('on', x.textContent === em)); };
    iconWrap.appendChild(b);
  });
  const dayWrap = $('mh_days');
  DOW.forEach((d, i) => {
    const b = document.createElement('div'); b.className = 'day-opt' + (selDays.includes(i) ? ' on' : ''); b.textContent = d[0];
    b.onclick = () => { selDays.includes(i) ? selDays.splice(selDays.indexOf(i), 1) : selDays.push(i); b.classList.toggle('on'); };
    dayWrap.appendChild(b);
  });
  $('mh_type').onchange = (e) => $('mh_targetWrap').classList.toggle('hidden', e.target.value === 'yesno');
  $('mh_cancel').onclick = closeModal;
  $('mh_save').onclick = () => {
    const name = $('mh_name').value.trim();
    if (!name) { toast('Give it a name 🙂'); return; }
    const type = $('mh_type').value;
    upsert('habits', Object.assign({}, h, {
      name, icon: selIcon, type,
      target: type === 'yesno' ? 1 : (parseFloat($('mh_target').value) || 1),
      unit: type === 'yesno' ? '' : $('mh_unit').value.trim(),
      reminder_time: $('mh_time').value || '20:00',
      schedule: selDays.sort()
    }));
    closeModal(); toast(isNew ? '✅ Habit added!' : '✅ Saved'); renderHabits();
  };
}

/* ----- EXPENSES PAGE ----- */
function rangeDays() { return expenseRange === 'week' ? 7 : expenseRange === 'month' ? 30 : 90; }

function renderExpenses() {
  const days = rangeDays();
  const from = todayStr(daysAgo(days - 1));
  const list = S.expenses.filter(e => e.date >= from);
  const total = list.reduce((s, e) => s + Number(e.amount), 0);
  $('expTotal').textContent = fmtMoney(total);
  $('expTotalLabel').textContent = expenseRange === 'week' ? 'last 7 days' : expenseRange === 'month' ? 'last 30 days' : 'last 90 days';
  $('expAvg').textContent = fmtMoney(total / days);

  // daily bar chart
  const labels = [], data = [];
  for (let i = days - 1; i >= 0; i--) {
    const ds = todayStr(daysAgo(i));
    labels.push(ds.slice(5));
    data.push(S.expenses.filter(e => e.date === ds).reduce((s, e) => s + Number(e.amount), 0));
  }
  drawChart('chartDaily', {
    type: 'bar',
    data: { labels, datasets: [{ data, backgroundColor: '#6366f1', borderRadius: 6 }] },
    options: { plugins: { legend: { display: false } }, scales: { x: { ticks: { maxTicksLimit: 8 } } } }
  });

  // category donut
  const byCat = {};
  list.forEach(e => { byCat[e.category_id] = (byCat[e.category_id] || 0) + Number(e.amount); });
  const catIds = Object.keys(byCat).sort((a, b) => byCat[b] - byCat[a]);
  drawChart('chartCats', {
    type: 'doughnut',
    data: {
      labels: catIds.map(id => { const c = S.categories.find(x => x.id === id); return c ? `${c.icon} ${c.name}` : '?'; }),
      datasets: [{ data: catIds.map(id => byCat[id]),
        backgroundColor: catIds.map(id => (S.categories.find(x => x.id === id) || {}).color || '#9ca3af') }]
    },
    options: { plugins: { legend: { position: 'right', labels: { boxWidth: 12, font: { size: 10 } } } } }
  });

  // budgets (always current month)
  const m = todayStr().slice(0, 7);
  const bWrap = $('budgetBars'); bWrap.innerHTML = '';
  S.categories.filter(c => c.monthly_budget > 0).forEach(c => {
    const spent = S.expenses.filter(e => e.category_id === c.id && e.date.startsWith(m)).reduce((s, e) => s + Number(e.amount), 0);
    const pct = Math.min(100, spent / c.monthly_budget * 100);
    const cls = pct >= 100 ? 'over' : pct >= 80 ? 'warn' : '';
    const el = document.createElement('div'); el.className = 'budget-item';
    el.innerHTML = `<div class="budget-top"><span>${c.icon} ${c.name}</span>
      <span>${fmtMoney(spent)} / ${fmtMoney(c.monthly_budget)}</span></div>
      <div class="budget-bar"><div class="budget-fill ${cls}" style="width:${pct}%"></div></div>`;
    bWrap.appendChild(el);
  });
  if (!bWrap.children.length) bWrap.innerHTML = '<p class="muted small center">Set monthly budgets on categories in Settings</p>';

  // by account
  const aWrap = $('accountTotals'); aWrap.innerHTML = '';
  S.accounts.forEach(a => {
    const t = list.filter(e => e.account_id === a.id).reduce((s, e) => s + Number(e.amount), 0);
    const el = document.createElement('div'); el.className = 'setting-row';
    el.innerHTML = `<span>${a.icon}</span><span class="grow">${a.name}</span><b>${fmtMoney(t)}</b>`;
    aWrap.appendChild(el);
  });

  renderExpenseList($('allExpenses'), list);
}

function drawChart(id, config) {
  if (charts[id]) charts[id].destroy();
  if (typeof Chart === 'undefined') return; // offline without cached CDN
  charts[id] = new Chart($(id), config);
}

/* ----- SETTINGS ----- */
function renderSettings() {
  updateSyncStatus();
  // push status
  const ps = $('pushStatus');
  if (!hasSupabase) ps.textContent = 'Needs Supabase setup (see README) — notifications require a server.';
  else if (typeof Notification === 'undefined') ps.textContent = 'On iPhone: add this app to your Home Screen first, then enable push from inside it.';
  else if (Notification.permission === 'granted') ps.textContent = '✅ Notifications enabled on this device';
  else ps.textContent = 'Tap to allow reminders on this device';

  // accounts
  const aWrap = $('accountList'); aWrap.innerHTML = '';
  S.accounts.forEach(a => {
    const el = document.createElement('div'); el.className = 'setting-row';
    el.innerHTML = `<span>${a.icon}</span><div class="grow">${a.name}<div class="sub">${a.type}</div></div>`;
    const edit = document.createElement('button'); edit.className = 'btn-small'; edit.textContent = '✏️';
    edit.onclick = () => accountModal(a);
    const del = document.createElement('button'); del.className = 'btn-small danger'; del.textContent = '✕';
    del.onclick = () => { if (confirm(`Delete account "${a.name}"?`)) { removeRow('accounts', a.id); renderSettings(); } };
    el.append(edit, del); aWrap.appendChild(el);
  });

  // categories
  const cWrap = $('categoryList'); cWrap.innerHTML = '';
  S.categories.forEach(c => {
    const el = document.createElement('div'); el.className = 'setting-row';
    el.innerHTML = `<span>${c.icon}</span><div class="grow">${c.name}
      <div class="sub">${c.monthly_budget ? 'Budget: ' + fmtMoney(c.monthly_budget) + '/mo' : 'no budget'}</div></div>`;
    const edit = document.createElement('button'); edit.className = 'btn-small'; edit.textContent = '✏️';
    edit.onclick = () => categoryModal(c);
    const del = document.createElement('button'); del.className = 'btn-small danger'; del.textContent = '✕';
    del.onclick = () => { if (confirm(`Delete category "${c.name}"?`)) { removeRow('categories', c.id); renderSettings(); } };
    el.append(edit, del); cWrap.appendChild(el);
  });

  // recurring
  const rWrap = $('recurringList'); rWrap.innerHTML = '';
  S.recurring.forEach(r => {
    const cat = S.categories.find(c => c.id === r.category_id) || { icon: '📦' };
    const el = document.createElement('div'); el.className = 'setting-row';
    el.innerHTML = `<span>${cat.icon}</span><div class="grow">${r.note || 'Recurring'}
      <div class="sub">${fmtMoney(r.amount)} on day ${r.day} of every month</div></div>`;
    const edit = document.createElement('button'); edit.className = 'btn-small'; edit.textContent = '✏️';
    edit.onclick = () => recurringModal(r);
    const del = document.createElement('button'); del.className = 'btn-small danger'; del.textContent = '✕';
    del.onclick = () => { if (confirm(`Stop "${r.note}"?`)) { removeRow('recurring', r.id); renderSettings(); } };
    el.append(edit, del); rWrap.appendChild(el);
  });
  if (!S.recurring.length) rWrap.innerHTML = '<p class="muted small">None yet — e.g. rent on day 1, Netflix on day 5</p>';

  $('pinToggleBtn').textContent = S.settings.pin ? 'Change / remove PIN' : 'Set PIN';
  $('logoutBtn').style.display = hasSupabase ? '' : 'none';
}

function recurringModal(r) {
  const isNew = !r;
  r = r || { id: uuid(), note: '', amount: 0, day: 1, account_id: (S.accounts[0] || {}).id, category_id: (S.categories[0] || {}).id, last_posted: '' };
  const accOpts = S.accounts.map(a => `<option value="${a.id}" ${a.id===r.account_id?'selected':''}>${a.icon} ${a.name}</option>`).join('');
  const catOpts = S.categories.map(c => `<option value="${c.id}" ${c.id===r.category_id?'selected':''}>${c.icon} ${c.name}</option>`).join('');
  openModal(`
    <h3>${isNew ? 'New recurring expense' : 'Edit recurring expense'}</h3>
    <label>Name</label><input id="mr_note" value="${r.note}" placeholder="e.g. Rent, Netflix">
    <label>Amount (₹)</label><input id="mr_amount" type="number" value="${r.amount || ''}" min="1">
    <label>Day of month (1–28)</label><input id="mr_day" type="number" value="${r.day}" min="1" max="28">
    <label>Paid from</label><select id="mr_account">${accOpts}</select>
    <label>Category</label><select id="mr_category">${catOpts}</select>
    <div class="modal-actions"><button class="btn-primary" id="mr_save">Save</button>
    <button class="btn-small" id="mr_cancel">Cancel</button></div>`);
  $('mr_cancel').onclick = closeModal;
  $('mr_save').onclick = () => {
    const amount = parseFloat($('mr_amount').value);
    const note = $('mr_note').value.trim();
    if (!note || !amount || amount <= 0) { toast('Name and amount needed'); return; }
    upsert('recurring', Object.assign({}, r, {
      note, amount,
      day: Math.min(28, Math.max(1, parseInt($('mr_day').value) || 1)),
      account_id: $('mr_account').value, category_id: $('mr_category').value
    }));
    closeModal(); postRecurring(); renderSettings();
  };
}

function accountModal(a) {
  const isNew = !a;
  a = a || { id: uuid(), name: '', type: 'bank', icon: '🏦' };
  let selIcon = a.icon;
  openModal(`
    <h3>${isNew ? 'New account' : 'Edit account'}</h3>
    <label>Name</label><input id="ma_name" value="${a.name}" placeholder="e.g. SBI Savings">
    <label>Type</label>
    <select id="ma_type">
      <option value="bank" ${a.type==='bank'?'selected':''}>Bank</option>
      <option value="cash" ${a.type==='cash'?'selected':''}>Cash</option>
      <option value="upi" ${a.type==='upi'?'selected':''}>UPI / Wallet</option>
    </select>
    <label>Icon</label><div class="emoji-row" id="ma_icons"></div>
    <div class="modal-actions"><button class="btn-primary" id="ma_save">Save</button>
    <button class="btn-small" id="ma_cancel">Cancel</button></div>`);
  ACC_EMOJIS.forEach(em => {
    const b = document.createElement('span'); b.className = 'emoji-opt' + (em === selIcon ? ' on' : ''); b.textContent = em;
    b.onclick = () => { selIcon = em; $('ma_icons').querySelectorAll('.emoji-opt').forEach(x => x.classList.toggle('on', x.textContent === em)); };
    $('ma_icons').appendChild(b);
  });
  $('ma_cancel').onclick = closeModal;
  $('ma_save').onclick = () => {
    const name = $('ma_name').value.trim(); if (!name) { toast('Name?'); return; }
    upsert('accounts', Object.assign({}, a, { name, type: $('ma_type').value, icon: selIcon }));
    closeModal(); renderSettings();
  };
}

function categoryModal(c) {
  const isNew = !c;
  c = c || { id: uuid(), name: '', icon: '📦', color: '#6366f1', monthly_budget: 0 };
  let selIcon = c.icon;
  openModal(`
    <h3>${isNew ? 'New category' : 'Edit category'}</h3>
    <label>Name</label><input id="mc_name" value="${c.name}">
    <label>Icon</label><div class="emoji-row" id="mc_icons"></div>
    <label>Color</label><input id="mc_color" type="color" value="${c.color}">
    <label>Monthly budget (₹, 0 = none)</label><input id="mc_budget" type="number" value="${c.monthly_budget || 0}" min="0">
    <div class="modal-actions"><button class="btn-primary" id="mc_save">Save</button>
    <button class="btn-small" id="mc_cancel">Cancel</button></div>`);
  CAT_EMOJIS.forEach(em => {
    const b = document.createElement('span'); b.className = 'emoji-opt' + (em === selIcon ? ' on' : ''); b.textContent = em;
    b.onclick = () => { selIcon = em; $('mc_icons').querySelectorAll('.emoji-opt').forEach(x => x.classList.toggle('on', x.textContent === em)); };
    $('mc_icons').appendChild(b);
  });
  $('mc_cancel').onclick = closeModal;
  $('mc_save').onclick = () => {
    const name = $('mc_name').value.trim(); if (!name) { toast('Name?'); return; }
    upsert('categories', Object.assign({}, c, {
      name, icon: selIcon, color: $('mc_color').value,
      monthly_budget: parseFloat($('mc_budget').value) || 0
    }));
    closeModal(); renderSettings();
  };
}

/* ---------- modal helpers ---------- */
function openModal(html) { $('modalBox').innerHTML = html; $('modal').classList.remove('hidden'); }
function closeModal() { $('modal').classList.add('hidden'); }

/* ---------- PIN lock ---------- */
function pinFlow(mode, onOk) { // mode: 'enter'|'set'
  const scr = $('pinScreen'); scr.classList.remove('hidden');
  $('pinTitle').textContent = mode === 'set' ? 'Choose a PIN' : 'Enter PIN';
  let entry = '', firstPin = null;
  const dots = $('pinDots').children;
  const refresh = () => { for (let i = 0; i < 4; i++) dots[i].classList.toggle('fill', i < entry.length); };
  const pad = $('pinPad'); pad.innerHTML = '';
  [1,2,3,4,5,6,7,8,9,'',0,'⌫'].forEach(k => {
    const b = document.createElement('button');
    b.textContent = k; if (k === '') b.style.visibility = 'hidden';
    b.onclick = () => {
      if (k === '⌫') entry = entry.slice(0, -1);
      else if (entry.length < 4) entry += String(k);
      refresh();
      if (entry.length === 4) setTimeout(() => {
        if (mode === 'set') {
          if (!firstPin) { firstPin = entry; entry = ''; $('pinTitle').textContent = 'Repeat PIN'; refresh(); }
          else if (firstPin === entry) { scr.classList.add('hidden'); onOk(entry); }
          else { toast('PINs don\'t match'); firstPin = null; entry = ''; $('pinTitle').textContent = 'Choose a PIN'; refresh(); }
        } else {
          if (entry === S.settings.pin) { scr.classList.add('hidden'); onOk(); }
          else { toast('Wrong PIN'); entry = ''; refresh(); }
        }
      }, 120);
    };
    pad.appendChild(b);
  });
  refresh();
}

/* ---------- push notifications ---------- */
function urlB64ToUint8(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}
async function enablePush() {
  if (!hasSupabase || !cfg.VAPID_PUBLIC_KEY) { toast('Set up Supabase + VAPID keys first (README)'); return; }
  if (typeof Notification === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    toast('On iPhone: add to Home Screen first, then enable push'); return;
  }
  if (!window.matchMedia('(display-mode: standalone)').matches && /iPhone|iPad/.test(navigator.userAgent)) {
    toast('On iPhone: first add this app to your Home Screen, then enable push from inside it');
    return;
  }
  try {
    const perm = await Notification.requestPermission();
    if (perm !== 'granted') { toast('Permission denied'); return; }
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true, applicationServerKey: urlB64ToUint8(cfg.VAPID_PUBLIC_KEY)
    });
    const { error } = await sb.from('push_subs').upsert({
      id: uuid(), user_id: sessionUser.id, subscription: sub.toJSON()
    });
    if (error) throw error;
    toast('🔔 Notifications enabled!'); renderSettings();
  } catch (e) { console.error(e); toast('Push setup failed: ' + (e.message || e)); }
}

/* ---------- export ---------- */
function download(filename, text, mime) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type: mime }));
  a.download = filename; a.click();
}
function exportJSON() { download(`daily-tracker-${todayStr()}.json`, JSON.stringify(S, null, 2), 'application/json'); }
function exportCSV() {
  const rows = [['date','amount','category','account','note']];
  S.expenses.forEach(e => {
    const c = S.categories.find(x => x.id === e.category_id) || {};
    const a = S.accounts.find(x => x.id === e.account_id) || {};
    rows.push([e.date, e.amount, c.name || '', a.name || '', (e.note || '').replace(/,/g, ';')]);
  });
  download(`expenses-${todayStr()}.csv`, rows.map(r => r.join(',')).join('\n'), 'text/csv');
}

/* ---------- auth + boot ---------- */
async function boot() {
  loadLocal();

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(console.warn);
  }

  if (hasSupabase && typeof supabase !== 'undefined') {
    sb = supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
    const { data: { session } } = await sb.auth.getSession();
    if (session) { sessionUser = session.user; await afterLogin(); }
    else showLogin();
  } else {
    // local-only mode
    startApp();
  }

  window.addEventListener('online', flushQueue);
}

function showLogin() {
  $('loginScreen').classList.remove('hidden');
  $('loginBtn').onclick = async () => {
    $('loginError').textContent = '';
    const { data, error } = await sb.auth.signInWithPassword({
      email: $('loginEmail').value.trim(), password: $('loginPassword').value
    });
    if (error) { $('loginError').textContent = error.message; return; }
    sessionUser = data.user;
    $('loginScreen').classList.add('hidden');
    await afterLogin();
  };
}

async function afterLogin() {
  await flushQueue();
  await pullAll();
  startApp();
}

function startApp() {
  seedIfEmpty();
  postRecurring();
  const show = () => { $('app').classList.remove('hidden'); render(); };
  if (S.settings.pin) pinFlow('enter', show); else show();
}

/* ---------- events ---------- */
document.querySelectorAll('.tabbar button').forEach(b => b.onclick = () => switchView(b.dataset.view));
$('qeSave').onclick = saveQuickExpense;
$('addHabitBtn').onclick = () => habitModal(null);
$('addAccountBtn').onclick = () => accountModal(null);
$('addCategoryBtn').onclick = () => categoryModal(null);
$('addRecurringBtn').onclick = () => recurringModal(null);
$('enablePushBtn').onclick = enablePush;
$('exportBtn').onclick = exportJSON;
$('exportCsvBtn').onclick = exportCSV;
$('pinToggleBtn').onclick = () => {
  if (S.settings.pin) {
    if (confirm('Remove PIN lock?')) { S.settings.pin = null; saveLocal(); renderSettings(); toast('PIN removed'); }
  } else {
    pinFlow('set', (pin) => { S.settings.pin = pin; saveLocal(); renderSettings(); toast('🔒 PIN set'); });
  }
};
$('logoutBtn').onclick = async () => {
  if (sb) await sb.auth.signOut();
  localStorage.removeItem(LS_KEY); localStorage.removeItem(QUEUE_KEY);
  location.reload();
};
$('expenseRange').querySelectorAll('button').forEach(b => b.onclick = () => {
  expenseRange = b.dataset.r;
  $('expenseRange').querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b));
  renderExpenses();
});
$('modal').addEventListener('click', (e) => { if (e.target === $('modal')) closeModal(); });

boot();
