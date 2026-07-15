import { describe, expect, it } from 'vitest';
import { appShell } from './shell';
import { tailwindRules } from './tailwind-styles';

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

describe('Tailwind style coverage', () => {
  const stylesFor = (selector: string) => tailwindRules.find(([candidate]) => candidate === selector)?.[1] ?? '';

  it('keeps legacy CSS responsibilities in Tailwind utilities', () => {
    expect(stylesFor('.habit-sub')).toContain('items-center');
    expect(stylesFor('.habit-sub svg.lucide')).toContain('size-[11px]');
    expect(stylesFor('.row-ic-inline')).toContain('min-w-0');
    expect(stylesFor('.confirm-ic')).toContain('rounded-full');
    expect(stylesFor('.chart-caption')).toContain('mb-1.5');
  });

  it('uses theme tokens for primary surfaces', () => {
    expect(stylesFor('body')).toContain('bg-[var(--bg)]');
    expect(stylesFor('.card')).toContain('bg-[var(--card)]');
    expect(stylesFor('.habit-check')).toContain('border-[var(--line)]');
  });
});
