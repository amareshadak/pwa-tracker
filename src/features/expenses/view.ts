export const expensesView = () => `
  <section id="view-expenses" class="view hidden space-y-4">
    <div class="seg" id="expenseRange"><button data-r="week" class="on">Week</button><button data-r="month">Month</button><button data-r="3m">3 Months</button></div>
    <div class="summary-row">
      <div class="summary-card grad-c"><div class="summary-num" id="expTotal">₹0</div><div class="summary-label" id="expTotalLabel">this week</div></div>
      <div class="summary-card grad-d"><div class="summary-num" id="expAvg">₹0</div><div class="summary-label">daily average</div></div>
    </div>
    <div class="card"><canvas id="chartDaily" height="170"></canvas></div><div class="card"><canvas id="chartCats" height="200"></canvas></div>
    <h2 class="section-title">Budgets</h2><div id="budgetBars"></div>
    <h2 class="section-title">By account</h2><div id="accountTotals"></div>
    <h2 class="section-title">All expenses</h2><input type="text" id="expenseSearch" class="search-input" placeholder="Search note, category, account…"><div id="allExpenses" class="expense-list"></div>
  </section>`;
