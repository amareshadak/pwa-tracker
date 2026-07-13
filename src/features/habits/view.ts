export const habitsView = () => `
  <section id="view-habits" class="view hidden space-y-4">
    <div class="row-between"><h2 class="section-title">My habits</h2><button class="btn-small" id="addHabitBtn">+ Add</button></div>
    <div class="card" id="weekdayCard"><p class="muted small mb-1.5">Completion by weekday (last 30 days)</p><canvas id="chartWeekdays" height="140"></canvas></div>
    <div id="habitCards"></div><div id="habitDetail" class="hidden"></div>
  </section>`;
