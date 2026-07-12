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

/* ---------- theme (light / dark / auto) ---------- */
function isDark() {
  const pref = (S.settings && S.settings.theme) || 'auto';
  if (pref === 'dark') return true;
  if (pref === 'light') return false;
  return typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: dark)').matches;
}
function applyTheme() {
  const dark = isDark();
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  const meta = document.getElementById('themeColorMeta');
  if (meta) meta.content = dark ? '#232323' : '#50A65C';
  if (typeof Chart !== 'undefined') {
    Chart.defaults.color = dark ? '#9AA294' : '#6B7A66';
    Chart.defaults.borderColor = dark ? 'rgba(248,250,237,.08)' : 'rgba(35,35,35,.07)';
  }
}

/* ---------- Lucide icon system (professional SVG icons) ---------- */
const EMOJI_TO_ICON = { // legacy data (emoji) → lucide icon names
  '🌅':'sunrise','🏃':'dumbbell','💧':'glass-water','📝':'notebook-pen','🍔':'pizza','📖':'book-open',
  '🧘':'flower-2','😴':'bed-double','✅':'circle-check-big','🏠':'house','🛒':'shopping-cart','🍽️':'utensils',
  '🚗':'car','🛍️':'shopping-bag','🧴':'sparkles','📺':'tv','💳':'credit-card','🤝':'heart-handshake',
  '💊':'pill','🎬':'clapperboard','📚':'graduation-cap','🧾':'receipt','✈️':'plane','📦':'package',
  '🏦':'landmark','💵':'banknote','📱':'smartphone','👛':'wallet','💪':'dumbbell','🚭':'cigarette-off',
  '🙏':'heart','🎯':'target','🎨':'palette','🎸':'guitar','💻':'laptop','🧹':'paintbrush','🌿':'leaf',
  '☀️':'sun','❤️':'heart','🎁':'gift','⚽':'volleyball','🐕':'dog','👶':'baby','💼':'briefcase'
};
function iconName(v) {
  if (!v) return 'circle-check-big';
  if (/^[a-z0-9-]+$/.test(v)) return v;          // already a lucide name
  return EMOJI_TO_ICON[v] || 'sparkles';          // legacy emoji → mapped
}
function ic(v) { return `<i data-lucide="${iconName(v)}"></i>`; }
function refreshIcons() {
  if (typeof lucide !== 'undefined') { try { lucide.createIcons(); } catch (_) {} }
}

function toast(msg) {
  const t = $('toast'); t.textContent = msg; t.classList.remove('hidden');
  clearTimeout(t._h); t._h = setTimeout(() => t.classList.add('hidden'), 2200);
}

/* ---------- confetti ---------- */
function confetti() {
  const cv = $('confetti'), ctx = cv.getContext('2d');
  cv.width = innerWidth; cv.height = innerHeight;
  const colors = ['#50A65C', '#3E8A4A', '#232323', '#F8FAED', '#7FC287'];
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
  { name: 'Bank 1', type: 'bank', icon: 'landmark' },
  { name: 'Bank 2', type: 'bank', icon: 'landmark' },
  { name: 'Bank 3', type: 'bank', icon: 'landmark' },
  { name: 'Cash', type: 'cash', icon: 'banknote' }
];
const SEED_CATEGORIES = [
  { name: 'Home & Utilities', icon: 'house', color: '#50A65C', monthly_budget: 0 },
  { name: 'Grocery', icon: 'shopping-cart', color: '#3E8A4A', monthly_budget: 0 },
  { name: 'Food & Dining', icon: 'utensils', color: '#7FC287', monthly_budget: 0 },
  { name: 'Transport', icon: 'car', color: '#2F6E3B', monthly_budget: 0 },
  { name: 'Shopping', icon: 'shopping-bag', color: '#A3CDA6', monthly_budget: 0 },
  { name: 'Personal Use', icon: 'sparkles', color: '#5FB56C', monthly_budget: 0 },
  { name: 'Subscriptions', icon: 'tv', color: '#232323', monthly_budget: 0 },
  { name: 'Online Payments', icon: 'credit-card', color: '#456B49', monthly_budget: 0 },
  { name: 'Given to Someone', icon: 'heart-handshake', color: '#8FBF95', monthly_budget: 0 },
  { name: 'Health', icon: 'pill', color: '#67A870', monthly_budget: 0 },
  { name: 'Entertainment', icon: 'clapperboard', color: '#3B3B3B', monthly_budget: 0 },
  { name: 'Education', icon: 'graduation-cap', color: '#2C8547', monthly_budget: 0 },
  { name: 'Bills & EMI', icon: 'receipt', color: '#556B57', monthly_budget: 0 },
  { name: 'Travel', icon: 'plane', color: '#74B37E', monthly_budget: 0 },
  { name: 'Others', icon: 'package', color: '#9BA89C', monthly_budget: 0 }
];
const SEED_HABITS = [
  { name: 'Wake up early', icon: 'sunrise', type: 'yesno', target: 1, unit: '', reminder_time: '06:00', schedule: [] },
  { name: 'Exercise / walk', icon: 'dumbbell', type: 'duration', target: 30, unit: 'min', reminder_time: '07:00', schedule: [] },
  { name: 'Drink water', icon: 'glass-water', type: 'quantity', target: 8, unit: 'glasses', reminder_time: '12:00', schedule: [] },
  { name: 'Journal / plan day', icon: 'notebook-pen', type: 'yesno', target: 1, unit: '', reminder_time: '09:00', schedule: [] },
  { name: 'No junk food', icon: 'pizza', type: 'yesno', target: 1, unit: '', reminder_time: '20:00', schedule: [] },
  { name: 'Read', icon: 'book-open', type: 'duration', target: 20, unit: 'min', reminder_time: '21:30', schedule: [] },
  { name: 'Meditate', icon: 'flower-2', type: 'duration', target: 10, unit: 'min', reminder_time: '22:00', schedule: [] },
  { name: 'Sleep by 11 PM', icon: 'bed-double', type: 'yesno', target: 1, unit: '', reminder_time: '22:45', schedule: [] }
];
const EMOJIS = ['circle-check-big','sunrise','dumbbell','glass-water','notebook-pen','pizza','book-open','flower-2','bed-double','footprints','cigarette-off','heart','target','palette','guitar','laptop','paintbrush','leaf','sun','brain'];
const CAT_EMOJIS = ['house','shopping-cart','utensils','car','shopping-bag','sparkles','tv','credit-card','heart-handshake','pill','clapperboard','graduation-cap','receipt','plane','package','gift','volleyball','dog','baby','briefcase'];
const ACC_EMOJIS = ['landmark','banknote','smartphone','credit-card','wallet'];

/* ---------- state ---------- */
let S = { habits: [], habit_logs: [], accounts: [], categories: [], expenses: [], recurring: [], captures: [], settings: {} };
let sb = null;          // supabase client
let sessionUser = null; // supabase user
let currentView = 'today';
let expenseRange = 'week';
let expenseSearch = '';
function applySearchFilter(list) {
  if (!expenseSearch) return list;
  const q = expenseSearch.toLowerCase();
  return list.filter(e => {
    const cat = S.categories.find(c => c.id === e.category_id);
    const acc = S.accounts.find(a => a.id === e.account_id);
    return `${cat ? cat.name : ''} ${acc ? acc.name : ''} ${e.note || ''}`.toLowerCase().includes(q);
  });
}
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
    const tables = ['habits', 'habit_logs', 'accounts', 'categories', 'expenses', 'recurring', 'captures'];
    const results = await Promise.all(tables.map(t => sb.from(t).select('*')));
    if (results.some(r => r.error)) throw results.find(r => r.error).error;
    const [h, hl, a, c, e, rec, cap] = results.map(r => r.data);
    // only replace if server actually has data OR local empty
    if (h.length || a.length || c.length || !S.habits.length) {
      S.habits = h; S.habit_logs = hl; S.accounts = a; S.categories = c; S.expenses = e; S.recurring = rec; S.captures = cap;
    }
    saveLocal();
  } catch (e) { console.warn('pull failed', e.message || e); }
}
function updateSyncStatus() {
  const el = $('syncStatus'); if (!el) return;
  if (!hasSupabase) { el.textContent = 'Local-only mode. Add Supabase keys in config.js to enable sync + push.'; return; }
  const pending = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]').length;
  el.textContent = sessionUser
    ? (pending ? `Synced (${pending} pending)` : 'Synced with Supabase')
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
  $('greeting').textContent = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  if (currentView === 'today') renderToday();
  if (currentView === 'habits') renderHabits();
  if (currentView === 'expenses') renderExpenses();
  if (currentView === 'settings') renderSettings();
  renderStreakBadge();
  refreshIcons();
}

function renderStreakBadge() {
  const active = S.habits.filter(h => !h.archived);
  const maxCur = active.length ? Math.max(...active.map(h => streaks(h).cur)) : 0;
  $('streakBadge').innerHTML = `${ic('flame')} ${maxCur}`;
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

  renderCaptures();

  // habit checklist
  const wrap = $('todayHabits'); wrap.innerHTML = '';
  todays.forEach(h => {
    const log = logFor(h.id, ds);
    const val = log ? log.value : 0;
    const done = log && log.completed;
    const row = document.createElement('div');
    row.className = 'habit-row' + (done ? ' done' : '');
    const sub = h.type === 'yesno' ? (h.reminder_time ? ic('clock') + ' ' + h.reminder_time : '') :
      `${val}/${h.target} ${h.unit} · ${ic('clock')} ${h.reminder_time || ''}`;
    row.innerHTML = `<div class="habit-emoji">${ic(h.icon)}</div>
      <div class="habit-info"><div class="habit-name">${h.name}</div><div class="habit-sub">${sub}</div></div>`;
    if (h.type === 'yesno') {
      const btn = document.createElement('button');
      btn.className = 'habit-check' + (done ? ' on' : '');
      btn.innerHTML = done ? ic('check') : '';
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
  if (!todays.length) wrap.innerHTML = '<p class="muted center">No habits scheduled today</p>';

  renderExpenseList($('todayExpenses'), todayExp);
}

/* ----- QUICK CAPTURE ----- */
function renderCaptures() {
  const wrap = $('captureList'); if (!wrap) return;
  wrap.innerHTML = '';
  const items = (S.captures || []).filter(c => c.status === 'inbox').sort((a, b) => b.created_at.localeCompare(a.created_at));
  items.forEach(c => {
    const el = document.createElement('div'); el.className = 'capture-row';
    el.innerHTML = `<div class="capture-body"><div class="capture-text">${c.raw_text}</div>
      <div class="capture-ai">${c.ai_summary ? ic('sparkles') + c.ai_summary : ic('loader-circle') + 'thinking…'}</div></div>`;
    const done = document.createElement('button'); done.className = 'capture-done'; done.innerHTML = ic('check');
    done.onclick = () => { upsert('captures', Object.assign({}, c, { status: 'done' })); renderCaptures(); };
    const del = document.createElement('button'); del.className = 'capture-del'; del.innerHTML = ic('x');
    del.onclick = () => { removeRow('captures', c.id); renderCaptures(); };
    el.append(done, del);
    wrap.appendChild(el);
  });
  refreshIcons();
}

function addCapture() {
  const input = $('captureText');
  const text = input.value.trim();
  if (!text) return;
  const row = { id: uuid(), raw_text: text, ai_type: null, ai_summary: null, status: 'inbox', created_at: new Date().toISOString() };
  upsert('captures', row);
  input.value = '';
  renderCaptures();
  processCaptureAI(row);
}

async function processCaptureAI(row) {
  if (!hasSupabase || !sb || !sessionUser) return;
  try {
    const { data, error } = await sb.functions.invoke('parse-capture', { body: { text: row.raw_text } });
    if (error || !data || data.error) return;
    upsert('captures', Object.assign({}, row, { ai_type: data.type || null, ai_summary: data.summary || null }));
    renderCaptures();
  } catch (_) { /* best-effort — raw text is already saved either way */ }
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
      note: (r.note || 'Recurring') + ' (auto)', date: `${m}-${dd}`
    });
    upsert('recurring', Object.assign({}, r, { last_posted: m }));
    toast(`${r.note || 'Recurring'}: ${fmtMoney(r.amount)} added`);
  });
}

function celebrate(h) {
  const { cur } = streaks(h);
  const streak = cur + 1;
  if (streak >= 3 && (streak % 5 === 0 || streak === 3 || streak === 7)) {
    confetti(); toast(`${streak} days strong — keep the streak!`);
  } else {
    toast('Done. Nice one!');
  }
}

function renderQuickExpense() {
  const accWrap = $('qeAccounts'); accWrap.innerHTML = '';
  if (!qeSelAccount && S.accounts.length) qeSelAccount = S.accounts[0].id;
  S.accounts.forEach(a => {
    const c = document.createElement('button');
    c.className = 'chip' + (qeSelAccount === a.id ? ' on' : '');
    c.innerHTML = `${ic(a.icon)} ${a.name}`;
    c.onclick = () => { qeSelAccount = a.id; renderQuickExpense(); };
    accWrap.appendChild(c);
  });
  const catWrap = $('qeCategories'); catWrap.innerHTML = '';
  S.categories.forEach(cat => {
    const c = document.createElement('div');
    c.className = 'cat-cell' + (qeSelCategory === cat.id ? ' on' : '');
    c.innerHTML = `<span>${ic(cat.icon)}</span>${cat.name}`;
    c.onclick = () => { qeSelCategory = cat.id; renderQuickExpense(); };
    catWrap.appendChild(c);
  });
  refreshIcons();
}

function saveQuickExpense() {
  const amt = parseFloat($('qeAmount').value);
  if (!amt || amt <= 0) { toast('Enter an amount'); return; }
  if (!qeSelCategory) { toast('Pick a category'); return; }
  const exp = {
    id: uuid(), amount: amt, account_id: qeSelAccount, category_id: qeSelCategory,
    note: $('qeNote').value.trim(), date: $('qeDate').value || todayStr()
  };
  upsert('expenses', exp);
  $('qeAmount').value = ''; $('qeNote').value = ''; $('qeDate').value = todayStr(); qeSelCategory = null;
  closeSheet();
  toast(`${fmtMoney(amt)} added`);
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
  if (pct >= 100) toast(`${cat.name} budget exceeded (${fmtMoney(spent)})`);
  else if (pct >= 80) toast(`${cat.name}: ${Math.round(pct)}% of budget used`);
}

function renderExpenseList(container, expenses) {
  container.innerHTML = '';
  const sorted = [...expenses].sort((a, b) => b.date.localeCompare(a.date));
  sorted.forEach(e => {
    const cat = S.categories.find(c => c.id === e.category_id) || { icon: 'package', name: '?' };
    const acc = S.accounts.find(a => a.id === e.account_id) || { name: '' };
    const row = document.createElement('div'); row.className = 'exp-row';
    row.innerHTML = `<div class="exp-emoji">${ic(cat.icon)}</div>
      <div class="exp-info"><div class="exp-cat">${cat.name}</div>
      <div class="exp-note">${e.date} · ${acc.name}${e.note ? ' · ' + e.note : ''}</div></div>
      <div class="exp-amt">${fmtMoney(e.amount)}</div>`;
    const edit = document.createElement('button'); edit.className = 'exp-edit'; edit.innerHTML = ic('pencil');
    edit.onclick = () => expenseModal(e);
    const del = document.createElement('button'); del.className = 'exp-del'; del.innerHTML = ic('x');
    del.onclick = async () => { if (await confirmDlg('Delete this expense?')) { removeRow('expenses', e.id); render(); } };
    row.append(edit, del);
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
      backgroundColor: sched.map((s, i) => (s && done[i] / s < 0.5) ? '#B95C50' : '#50A65C'),
      borderRadius: 6 }] },
    options: { plugins: { legend: { display: false } },
      scales: { y: { max: 100, ticks: { callback: v => v + '%' } } } }
  });
  S.habits.filter(h => !h.archived).forEach(h => {
    const st = streaks(h);
    const card = document.createElement('div'); card.className = 'habit-card';
    card.innerHTML = `<div class="habit-card-top">
        <div class="habit-emoji">${ic(h.icon)}</div>
        <div class="habit-info"><div class="habit-name">${h.name}</div>
          <div class="habit-sub">${ic('clock')} ${h.reminder_time || 'no reminder'} · ${(h.schedule||[]).length ? (h.schedule.map(d=>DOW[d]).join(' ')) : 'daily'}</div></div>
        <div class="pill pill-flame">${ic('flame')} ${st.cur}</div></div>
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
    <button class="btn-small" id="backToHabits">${ic('arrow-left')} Back</button>
    <div class="habit-card" style="margin-top:10px">
      <div class="habit-card-top">
        <div class="habit-emoji">${ic(h.icon)}</div>
        <div class="habit-info"><div class="habit-name">${h.name}</div>
        <div class="habit-sub">${h.type === 'yesno' ? 'Yes / No' : `Target: ${h.target} ${h.unit}`} · ${ic('clock')} ${h.reminder_time}</div></div>
      </div>
      <div class="streak-pills">
        <span class="pill pill-flame">${ic('flame')} Current: ${st.cur}</span><span class="pill">${ic('trophy')} Best: ${st.best}</span>
        <span class="pill">30d: ${completionPct(h,30)}%</span>
      </div>
      <div class="heatmap">${cells}</div>
      <div class="modal-actions">
        <button class="btn-primary" id="editHabitBtn">${ic('pencil')} Edit</button>
        <button class="btn-small danger" id="deleteHabitBtn">Delete</button>
      </div>
    </div>`;
  refreshIcons();
  $('backToHabits').onclick = () => renderHabits();
  $('editHabitBtn').onclick = () => habitModal(h);
  $('deleteHabitBtn').onclick = async () => {
    if (await confirmDlg(`Delete "${h.name}" and its history?`)) {
      S.habit_logs.filter(l => l.habit_id === h.id).forEach(l => removeRow('habit_logs', l.id));
      removeRow('habits', h.id); renderHabits(); refreshIcons();
    }
  };
}

/* ----- habit add/edit modal ----- */
function habitModal(h) {
  const isNew = !h;
  h = h || { id: uuid(), name: '', icon: 'circle-check-big', type: 'yesno', target: 1, unit: '', reminder_time: '20:00', schedule: [], archived: false };
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
    <label>Reminder time</label><input id="mh_time" type="time" value="${h.reminder_time}">
    <label>Days (none selected = every day)</label><div class="day-row" id="mh_days"></div>
    <div class="modal-actions">
      <button class="btn-primary" id="mh_save">Save</button>
      <button class="btn-small" id="mh_cancel">Cancel</button>
    </div>`);
  const iconWrap = $('mh_icons');
  EMOJIS.forEach(em => {
    const b = document.createElement('span'); b.className = 'emoji-opt' + (em === iconName(selIcon) ? ' on' : '');
    b.innerHTML = ic(em); b.dataset.icon = em;
    b.onclick = () => { selIcon = em; iconWrap.querySelectorAll('.emoji-opt').forEach(x => x.classList.toggle('on', x.dataset.icon === em)); };
    iconWrap.appendChild(b);
  });
  refreshIcons();
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
    if (!name) { toast('Give it a name'); return; }
    const type = $('mh_type').value;
    upsert('habits', Object.assign({}, h, {
      name, icon: selIcon, type,
      target: type === 'yesno' ? 1 : (parseFloat($('mh_target').value) || 1),
      unit: type === 'yesno' ? '' : $('mh_unit').value.trim(),
      reminder_time: $('mh_time').value || '20:00',
      schedule: selDays.sort()
    }));
    closeModal(); toast(isNew ? 'Habit added!' : 'Saved'); renderHabits(); refreshIcons();
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
    data: { labels, datasets: [{ data, backgroundColor: '#50A65C', borderRadius: 6 }] },
    options: { plugins: { legend: { display: false } }, scales: { x: { ticks: { maxTicksLimit: 8 } } } }
  });

  // category donut
  const byCat = {};
  list.forEach(e => { byCat[e.category_id] = (byCat[e.category_id] || 0) + Number(e.amount); });
  const catIds = Object.keys(byCat).sort((a, b) => byCat[b] - byCat[a]);
  drawChart('chartCats', {
    type: 'doughnut',
    data: {
      labels: catIds.map(id => { const c = S.categories.find(x => x.id === id); return c ? c.name : '?'; }),
      datasets: [{ data: catIds.map(id => byCat[id]),
        backgroundColor: catIds.map(id => (S.categories.find(x => x.id === id) || {}).color || '#9BA89C') }]
    },
    options: { plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, padding: 12, font: { size: 11 } } } } }
  });

  // budgets (always current month)
  const m = todayStr().slice(0, 7);
  const bWrap = $('budgetBars'); bWrap.innerHTML = '';
  S.categories.filter(c => c.monthly_budget > 0).forEach(c => {
    const spent = S.expenses.filter(e => e.category_id === c.id && e.date.startsWith(m)).reduce((s, e) => s + Number(e.amount), 0);
    const pct = Math.min(100, spent / c.monthly_budget * 100);
    const cls = pct >= 100 ? 'over' : pct >= 80 ? 'warn' : '';
    const el = document.createElement('div'); el.className = 'budget-item';
    el.innerHTML = `<div class="budget-top"><span class="row-ic-inline"><span class="ic">${ic(c.icon)}</span><span class="txt">${c.name}</span></span>
      <span class="budget-amt">${fmtMoney(spent)} / ${fmtMoney(c.monthly_budget)}</span></div>
      <div class="budget-bar"><div class="budget-fill ${cls}" style="width:${pct}%"></div></div>`;
    bWrap.appendChild(el);
  });
  if (!bWrap.children.length) bWrap.innerHTML = '<p class="muted small center">Set monthly budgets on categories in Settings</p>';

  // by account
  const aWrap = $('accountTotals'); aWrap.innerHTML = '';
  S.accounts.forEach(a => {
    const t = list.filter(e => e.account_id === a.id).reduce((s, e) => s + Number(e.amount), 0);
    const el = document.createElement('div'); el.className = 'setting-row';
    el.innerHTML = `<span class="row-ic">${ic(a.icon)}</span><span class="grow truncate">${a.name}</span><b>${fmtMoney(t)}</b>`;
    aWrap.appendChild(el);
  });

  renderExpenseList($('allExpenses'), applySearchFilter(list));
}

function drawChart(id, config) {
  if (charts[id]) charts[id].destroy();
  if (typeof Chart === 'undefined') return; // offline without cached CDN
  config.options = config.options || {};
  config.options.layout = Object.assign({ padding: { top: 12 } }, config.options.layout || {});
  charts[id] = new Chart($(id), config);
}

/* ----- SETTINGS ----- */
function renderSettings() {
  updateSyncStatus();
  // push status
  const ps = $('pushStatus');
  if (!hasSupabase) ps.textContent = 'Needs Supabase setup (see README) — notifications require a server.';
  else if (typeof Notification === 'undefined') ps.textContent = 'On iPhone: add this app to your Home Screen first, then enable push from inside it.';
  else if (Notification.permission === 'granted') ps.textContent = 'Notifications enabled on this device';
  else ps.textContent = 'Tap to allow reminders on this device';

  // accounts
  const aWrap = $('accountList'); aWrap.innerHTML = '';
  S.accounts.forEach(a => {
    const el = document.createElement('div'); el.className = 'setting-row';
    el.innerHTML = `<span class="row-ic">${ic(a.icon)}</span><div class="grow">${a.name}<div class="sub">${a.type}</div></div>`;
    const edit = document.createElement('button'); edit.className = 'btn-small btn-icon'; edit.innerHTML = ic('pencil');
    edit.onclick = () => accountModal(a);
    const del = document.createElement('button'); del.className = 'btn-small danger btn-icon'; del.innerHTML = ic('trash-2');
    del.onclick = async () => { if (await confirmDlg(`Delete account "${a.name}"?`)) { removeRow('accounts', a.id); renderSettings(); refreshIcons(); } };
    el.append(edit, del); aWrap.appendChild(el);
  });

  // categories
  const cWrap = $('categoryList'); cWrap.innerHTML = '';
  S.categories.forEach(c => {
    const el = document.createElement('div'); el.className = 'setting-row';
    el.innerHTML = `<span class="row-ic">${ic(c.icon)}</span><div class="grow">${c.name}
      <div class="sub">${c.monthly_budget ? 'Budget: ' + fmtMoney(c.monthly_budget) + '/mo' : 'no budget'}</div></div>`;
    const edit = document.createElement('button'); edit.className = 'btn-small btn-icon'; edit.innerHTML = ic('pencil');
    edit.onclick = () => categoryModal(c);
    const del = document.createElement('button'); del.className = 'btn-small danger btn-icon'; del.innerHTML = ic('trash-2');
    del.onclick = async () => { if (await confirmDlg(`Delete category "${c.name}"?`)) { removeRow('categories', c.id); renderSettings(); refreshIcons(); } };
    el.append(edit, del); cWrap.appendChild(el);
  });

  // recurring
  const rWrap = $('recurringList'); rWrap.innerHTML = '';
  S.recurring.forEach(r => {
    const cat = S.categories.find(c => c.id === r.category_id) || { icon: 'package' };
    const el = document.createElement('div'); el.className = 'setting-row';
    el.innerHTML = `<span class="row-ic">${ic(cat.icon)}</span><div class="grow">${r.note || 'Recurring'}
      <div class="sub">${fmtMoney(r.amount)} on day ${r.day} of every month</div></div>`;
    const edit = document.createElement('button'); edit.className = 'btn-small btn-icon'; edit.innerHTML = ic('pencil');
    edit.onclick = () => recurringModal(r);
    const del = document.createElement('button'); del.className = 'btn-small danger btn-icon'; del.innerHTML = ic('trash-2');
    del.onclick = async () => { if (await confirmDlg(`Stop "${r.note}"?`, 'Stop')) { removeRow('recurring', r.id); renderSettings(); refreshIcons(); } };
    el.append(edit, del); rWrap.appendChild(el);
  });
  if (!S.recurring.length) rWrap.innerHTML = '<p class="muted small">None yet — e.g. rent on day 1, Netflix on day 5</p>';

  $('pinToggleBtn').textContent = S.settings.pin ? 'Change / remove PIN' : 'Set PIN';
  $('logoutBtn').style.display = hasSupabase ? '' : 'none';

  // theme selector
  const pref = S.settings.theme || 'auto';
  $('themeSeg').querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.t === pref));

  refreshIcons();
}

function recurringModal(r) {
  const isNew = !r;
  r = r || { id: uuid(), note: '', amount: 0, day: 1, account_id: (S.accounts[0] || {}).id, category_id: (S.categories[0] || {}).id, last_posted: '' };
  const accOpts = S.accounts.map(a => `<option value="${a.id}" ${a.id===r.account_id?'selected':''}>${a.name}</option>`).join('');
  const catOpts = S.categories.map(c => `<option value="${c.id}" ${c.id===r.category_id?'selected':''}>${c.name}</option>`).join('');
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

function expenseModal(e) {
  const accOpts = S.accounts.map(a => `<option value="${a.id}" ${a.id===e.account_id?'selected':''}>${a.name}</option>`).join('');
  const catOpts = S.categories.map(c => `<option value="${c.id}" ${c.id===e.category_id?'selected':''}>${c.name}</option>`).join('');
  openModal(`
    <h3>Edit expense</h3>
    <label>Amount (₹)</label><input id="me_amount" type="number" value="${e.amount}" min="0">
    <label>Paid from</label><select id="me_account">${accOpts}</select>
    <label>Category</label><select id="me_category">${catOpts}</select>
    <label>Note</label><input id="me_note" value="${e.note || ''}">
    <label>Date</label><input id="me_date" type="date" value="${e.date}">
    <div class="modal-actions"><button class="btn-primary" id="me_save">Save</button>
    <button class="btn-small" id="me_cancel">Cancel</button></div>`);
  $('me_cancel').onclick = closeModal;
  $('me_save').onclick = () => {
    const amount = parseFloat($('me_amount').value);
    if (!amount || amount <= 0) { toast('Enter an amount'); return; }
    upsert('expenses', Object.assign({}, e, {
      amount, account_id: $('me_account').value, category_id: $('me_category').value,
      note: $('me_note').value.trim(), date: $('me_date').value || e.date
    }));
    closeModal(); toast('Saved'); render();
  };
}

function accountModal(a) {
  const isNew = !a;
  a = a || { id: uuid(), name: '', type: 'bank', icon: 'landmark' };
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
    const b = document.createElement('span'); b.className = 'emoji-opt' + (em === iconName(selIcon) ? ' on' : '');
    b.innerHTML = ic(em); b.dataset.icon = em;
    b.onclick = () => { selIcon = em; $('ma_icons').querySelectorAll('.emoji-opt').forEach(x => x.classList.toggle('on', x.dataset.icon === em)); };
    $('ma_icons').appendChild(b);
  });
  refreshIcons();
  $('ma_cancel').onclick = closeModal;
  $('ma_save').onclick = () => {
    const name = $('ma_name').value.trim(); if (!name) { toast('Name?'); return; }
    upsert('accounts', Object.assign({}, a, { name, type: $('ma_type').value, icon: selIcon }));
    closeModal(); renderSettings();
  };
}

function categoryModal(c) {
  const isNew = !c;
  c = c || { id: uuid(), name: '', icon: 'package', color: '#50A65C', monthly_budget: 0 };
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
    const b = document.createElement('span'); b.className = 'emoji-opt' + (em === iconName(selIcon) ? ' on' : '');
    b.innerHTML = ic(em); b.dataset.icon = em;
    b.onclick = () => { selIcon = em; $('mc_icons').querySelectorAll('.emoji-opt').forEach(x => x.classList.toggle('on', x.dataset.icon === em)); };
    $('mc_icons').appendChild(b);
  });
  refreshIcons();
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
function openModal(html) { $('modalBox').innerHTML = html; $('modal').classList.remove('hidden'); setTimeout(refreshIcons, 0); }
function closeModal() { $('modal').classList.add('hidden'); }

/* styled in-app confirm (replaces browser confirm()) */
function confirmDlg(msg, actionLabel) {
  return new Promise((resolve) => {
    openModal(`
      <div class="confirm-ic">${ic('trash-2')}</div>
      <p class="confirm-msg">${msg}</p>
      <div class="modal-actions">
        <button class="btn-primary btn-danger" id="cf_yes">${actionLabel || 'Delete'}</button>
        <button class="btn-small" id="cf_no">Cancel</button>
      </div>`);
    $('cf_yes').onclick = () => { closeModal(); resolve(true); };
    $('cf_no').onclick = () => { closeModal(); resolve(false); };
  });
}

/* expense bottom sheet */
function openSheet() {
  $('qeDate').value = todayStr();
  $('qeAiText').value = '';
  renderQuickExpense();
  $('expenseSheet').classList.remove('hidden');
  refreshIcons();
  setTimeout(() => $('qeAmount').focus(), 100);
}

/* AI quick-fill — parses free text into the existing form fields via Gemini (Supabase edge function) */
async function aiFillExpense() {
  const text = $('qeAiText').value.trim();
  if (!text) { toast('Type something first'); return; }
  if (!hasSupabase || !sb || !sessionUser) { toast('Sign in required for AI fill'); return; }
  if (!S.accounts.length || !S.categories.length) { toast('Add an account and category first'); return; }

  const btn = $('qeAiBtn');
  const origHtml = btn.innerHTML;
  btn.disabled = true; btn.classList.add('loading');
  btn.innerHTML = ic('loader-circle'); refreshIcons();

  try {
    const { data, error } = await sb.functions.invoke('parse-expense', {
      body: {
        text,
        categories: S.categories.map(c => ({ id: c.id, name: c.name })),
        accounts: S.accounts.map(a => ({ id: a.id, name: a.name }))
      }
    });
    if (error) throw error;
    if (data && data.error) throw new Error(data.error);

    if (data.amount) $('qeAmount').value = data.amount;
    if (data.account_id && S.accounts.some(a => a.id === data.account_id)) qeSelAccount = data.account_id;
    if (data.category_id && S.categories.some(c => c.id === data.category_id)) qeSelCategory = data.category_id;
    if (data.note) $('qeNote').value = data.note;
    if (data.date) $('qeDate').value = data.date;
    renderQuickExpense();
    toast('Filled — check & save');
  } catch (e) {
    console.error(e);
    toast('AI fill failed: ' + (e.message || e));
  } finally {
    btn.disabled = false; btn.classList.remove('loading');
    btn.innerHTML = origHtml; refreshIcons();
  }
}
function closeSheet() { $('expenseSheet').classList.add('hidden'); }

/* ---------- PIN lock ---------- */
function pinFlow(mode, onOk) { // mode: 'enter'|'set'
  const scr = $('pinScreen'); scr.classList.remove('hidden');
  $('pinTitle').textContent = mode === 'set' ? 'Choose a PIN' : 'Enter PIN';
  let entry = '', firstPin = null;
  const dots = $('pinDots').children;
  const refresh = () => { for (let i = 0; i < 4; i++) dots[i].classList.toggle('fill', i < entry.length); };
  const forgotBtn = $('pinForgotBtn');
  forgotBtn.classList.toggle('hidden', mode !== 'enter');
  forgotBtn.onclick = async () => {
    if (await confirmDlg('Reset PIN? Removes the lock — set a new PIN from Settings.', 'Reset')) {
      S.settings.pin = null; saveLocal();
      scr.classList.add('hidden');
      onOk();
    }
  };
  const pad = $('pinPad'); pad.innerHTML = '';
  [1,2,3,4,5,6,7,8,9,'',0,'⌫'].forEach(k => {
    const b = document.createElement('button');
    if (k === '⌫') b.innerHTML = ic('delete'); else b.textContent = k;
    if (k === '') b.style.visibility = 'hidden';
    b.onclick = () => {
      if (entry.length === 4) return; // ignore taps while the 4th-digit check is pending
      if (k === '⌫') entry = entry.slice(0, -1);
      else entry += String(k);
      refresh();
      if (entry.length === 4) {
        const val = entry;
        setTimeout(() => {
          if (mode === 'set') {
            if (!firstPin) { firstPin = val; entry = ''; $('pinTitle').textContent = 'Repeat PIN'; refresh(); }
            else if (firstPin === val) { scr.classList.add('hidden'); onOk(val); }
            else { toast('PINs don\'t match'); firstPin = null; entry = ''; $('pinTitle').textContent = 'Choose a PIN'; refresh(); }
          } else {
            if (val === S.settings.pin) { scr.classList.add('hidden'); onOk(); }
            else { toast('Wrong PIN'); entry = ''; refresh(); }
          }
        }, 120);
      }
    };
    pad.appendChild(b);
  });
  refresh();
  refreshIcons();
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
      id: uuid(), user_id: sessionUser.id, subscription: sub.toJSON(), endpoint: sub.endpoint
    }, { onConflict: 'user_id,endpoint' });
    if (error) throw error;
    toast('Notifications enabled!'); renderSettings();
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

function importJSON(file) {
  const reader = new FileReader();
  reader.onload = async () => {
    let parsed;
    try { parsed = JSON.parse(reader.result); } catch { toast('Invalid JSON file'); return; }
    const tables = ['habits', 'accounts', 'categories', 'expenses', 'recurring', 'habit_logs', 'captures'];
    const found = tables.filter(t => Array.isArray(parsed[t]) && parsed[t].length);
    if (!found.length) { toast('No recognizable data in file'); return; }
    const summary = found.map(t => `${t}: ${parsed[t].length}`).join(', ');
    if (!(await confirmDlg(`Import ${summary}? Matching IDs update existing records, others get added.`, 'Import'))) return;
    found.forEach(t => parsed[t].forEach(row => upsert(t, row)));
    toast('Import complete'); render(); refreshIcons();
  };
  reader.readAsText(file);
}

/* ---------- auth + boot ---------- */
async function boot() {
  loadLocal();
  applyTheme();
  if (typeof matchMedia !== 'undefined') {
    try {
      matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { applyTheme(); render(); });
    } catch (_) {}
  }

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
$('captureSaveBtn').onclick = addCapture;
$('captureText').addEventListener('keydown', (e) => { if (e.key === 'Enter') addCapture(); });
$('qeAiBtn').onclick = aiFillExpense;
$('fab').onclick = openSheet;
$('expenseSheet').addEventListener('click', (e) => { if (e.target === $('expenseSheet')) closeSheet(); });
$('addHabitBtn').onclick = () => habitModal(null);
$('addAccountBtn').onclick = () => accountModal(null);
$('addCategoryBtn').onclick = () => categoryModal(null);
$('addRecurringBtn').onclick = () => recurringModal(null);
$('enablePushBtn').onclick = enablePush;
$('exportBtn').onclick = exportJSON;
$('exportCsvBtn').onclick = exportCSV;
$('importBtn').onclick = () => $('importFile').click();
$('importFile').onchange = (e) => { if (e.target.files[0]) importJSON(e.target.files[0]); e.target.value = ''; };
$('expenseSearch').oninput = (e) => {
  expenseSearch = e.target.value;
  const days = rangeDays();
  const from = todayStr(daysAgo(days - 1));
  const list = S.expenses.filter(x => x.date >= from);
  renderExpenseList($('allExpenses'), applySearchFilter(list));
};
$('pinToggleBtn').onclick = async () => {
  if (S.settings.pin) {
    if (await confirmDlg('Remove PIN lock?', 'Remove')) { S.settings.pin = null; saveLocal(); renderSettings(); toast('PIN removed'); }
  } else {
    pinFlow('set', (pin) => { S.settings.pin = pin; saveLocal(); renderSettings(); toast('PIN set'); });
  }
};
$('logoutBtn').onclick = async () => {
  if (sb) await sb.auth.signOut();
  localStorage.removeItem(LS_KEY); localStorage.removeItem(QUEUE_KEY);
  location.reload();
};
$('themeSeg').querySelectorAll('button').forEach(b => b.onclick = () => {
  S.settings.theme = b.dataset.t; saveLocal();
  applyTheme(); render();
});
$('expenseRange').querySelectorAll('button').forEach(b => b.onclick = () => {
  expenseRange = b.dataset.r;
  $('expenseRange').querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b));
  renderExpenses();
});
$('modal').addEventListener('click', (e) => { if (e.target === $('modal')) closeModal(); });

boot();
