export const todayView = () => `
  <section id="view-today" class="view">
    <div class="summary-row">
      <div class="summary-card grad-a"><div class="summary-num" id="sumHabits">0/0</div><div class="summary-label">habits done</div></div>
      <div class="summary-card grad-b"><div class="summary-num" id="sumSpend">₹0</div><div class="summary-label">spent today</div></div>
    </div>
    <h2 class="section-title">Quick capture</h2>
    <div class="card">
      <div class="capture-input-row">
        <input type="text" id="captureText" placeholder="Jot an idea, task, or reminder…">
        <button id="captureSaveBtn" class="capture-save-btn" aria-label="Save"><i data-lucide="send"></i></button>
      </div>
      <div id="captureList"></div>
    </div>
    <div class="row-between"><h2 class="section-title">Tasks & reminders</h2><button class="btn-small" id="addTaskBtn">+ Add</button></div>
    <div class="seg" id="taskFilter">
      <button data-task-filter="pending" class="on">Pending</button><button data-task-filter="completed">Completed</button><button data-task-filter="all">All</button>
    </div>
    <div id="taskList" class="task-list"></div>
    <h2 class="section-title">Today's habits</h2><div id="todayHabits" class="habit-list"></div>
    <h2 class="section-title">Today's expenses</h2><div id="todayExpenses" class="expense-list"></div>
  </section>`;
