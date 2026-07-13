export const settingsView = () => `
  <section id="view-settings" class="view hidden space-y-4">
    <h2 class="section-title">Appearance</h2><div class="seg" id="themeSeg"><button data-t="auto">Auto</button><button data-t="light">Light</button><button data-t="dark">Dark</button></div>
    <h2 class="section-title">Notifications</h2><div class="card"><button class="btn-primary" id="enablePushBtn">Enable Push Notifications</button><p class="muted small" id="pushStatus"></p></div>
    <h2 class="section-title">Accounts (paid from)</h2><div id="accountList"></div><button class="btn-small" id="addAccountBtn">+ Add account</button>
    <h2 class="section-title">Categories</h2><div id="categoryList"></div><button class="btn-small" id="addCategoryBtn">+ Add category</button>
    <h2 class="section-title">Recurring expenses</h2><div id="recurringList"></div><button class="btn-small" id="addRecurringBtn">+ Add recurring (rent, subscriptions…)</button>
    <h2 class="section-title">Security</h2><div class="card row-between"><span>4-digit PIN lock</span><button class="btn-small" id="pinToggleBtn">Set PIN</button></div>
    <h2 class="section-title">Data</h2>
    <div class="card col-gap">
      <button class="btn-small" id="exportBtn"><i data-lucide="download"></i> Export JSON</button><button class="btn-small" id="exportCsvBtn"><i data-lucide="download"></i> Export expenses CSV</button>
      <button class="btn-small" id="importBtn"><i data-lucide="upload"></i> Import JSON</button><input type="file" id="importFile" accept="application/json" class="hidden"><p class="muted small" id="syncStatus"></p><button class="btn-small danger" id="logoutBtn">Sign out</button>
    </div>
    <p class="muted small center">Daily Tracker v2.0</p>
  </section>`;
