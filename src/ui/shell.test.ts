import { describe, expect, it } from 'vitest';
import { appShell } from './shell';

describe('application shell', () => {
  it('contains every feature mount and global interaction surface', () => {
    const html = appShell();
    const requiredIds = [
      'app', 'view-today', 'view-habits', 'view-expenses', 'view-settings',
      'captureList', 'taskList', 'todayHabits', 'todayExpenses', 'habitCards',
      'allExpenses', 'accountList', 'categoryList', 'recurringList',
      'expenseSheet', 'modal', 'toast', 'loginScreen', 'pinScreen'
    ];
    for (const id of requiredIds) expect(html).toContain(`id="${id}"`);
  });

  it('keeps primary navigation and data actions available', () => {
    const html = appShell();
    for (const label of ['Today', 'Habits', 'Money', 'More', 'Export JSON', 'Import JSON', 'Enable Push Notifications']) {
      expect(html).toContain(label);
    }
  });
});
