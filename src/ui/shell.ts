import { expensesView } from '../features/expenses/view';
import { habitsView } from '../features/habits/view';
import { settingsView } from '../features/settings/view';
import { todayView } from '../features/today/view';

const lockScreen = () => `<div id="pinScreen" class="overlay hidden"><div class="pin-box"><div class="pin-emoji"><i data-lucide="lock-keyhole"></i></div><h2 id="pinTitle">Enter PIN</h2><div class="pin-dots" id="pinDots"><span></span><span></span><span></span><span></span></div><div class="pin-pad" id="pinPad"></div><button id="pinForgotBtn" class="link-btn hidden">Forgot PIN?</button></div></div>`;

const loginScreen = () => `<div id="loginScreen" class="overlay hidden"><div class="login-box"><div class="login-logo"><i data-lucide="circle-check-big"></i></div><h1>Daily Tracker</h1><p class="muted">Sign in with your tracker account</p><input type="email" id="loginEmail" placeholder="Email" autocomplete="username"><input type="password" id="loginPassword" placeholder="Password" autocomplete="current-password"><button class="btn-primary" id="loginBtn">Sign In</button><p class="login-error" id="loginError"></p></div></div>`;

const expenseSheet = () => `<div id="expenseSheet" class="overlay sheet-overlay hidden"><div class="sheet"><div class="sheet-handle"></div><h3 class="sheet-title">Add expense</h3><div class="quick-expense"><div class="ai-quickfill"><input type="text" id="qeAiText" placeholder="Or type: 250 lunch swiggy hdfc"><button class="ai-fill-btn" id="qeAiBtn" aria-label="AI fill"><i data-lucide="wand-sparkles"></i></button></div><div class="amount-row"><span class="rupee">₹</span><input type="number" id="qeAmount" placeholder="0" inputmode="decimal" min="0"></div><div id="qeAccounts" class="chip-row"></div><div id="qeCategories" class="cat-grid"></div><input type="text" id="qeNote" placeholder="Note (optional)"><input type="date" id="qeDate" title="Date"><button class="btn-primary" id="qeSave">Add Expense</button></div></div></div>`;

export function appShell(): string {
  return `${lockScreen()}${loginScreen()}
    <div id="app" class="hidden min-h-dvh">
      <header class="app-header"><div><h1 id="greeting">Hello</h1><p class="muted" id="todayDate"></p></div><div class="header-badges"><span class="badge" id="streakBadge"><i data-lucide="flame"></i> 0</span></div></header>
      <main id="main">${todayView()}${habitsView()}${expensesView()}${settingsView()}</main>
      <button id="fab" aria-label="Add expense"><i data-lucide="plus"></i></button>
      <nav class="tabbar"><button data-view="today" class="on"><span><i data-lucide="house"></i></span>Today</button><button data-view="habits"><span><i data-lucide="list-checks"></i></span>Habits</button><button data-view="expenses"><span><i data-lucide="wallet"></i></span>Money</button><button data-view="settings"><span><i data-lucide="settings"></i></span>More</button></nav>
    </div>
    ${expenseSheet()}<div id="modal" class="overlay hidden"><div class="modal-box" id="modalBox"></div></div><div id="toast" class="toast hidden"></div><canvas id="confetti"></canvas>`;
}

export function mountApp(root: HTMLElement): void {
  root.innerHTML = appShell();
}
