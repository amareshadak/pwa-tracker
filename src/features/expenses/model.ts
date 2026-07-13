import type { Account, Category, Expense } from '../../core/types';

export function searchExpenses(
  expenses: Expense[],
  query: string,
  categories: Category[],
  accounts: Account[]
): Expense[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return expenses;
  return expenses.filter(expense => {
    const category = categories.find(item => item.id === expense.category_id)?.name || '';
    const account = accounts.find(item => item.id === expense.account_id)?.name || '';
    return `${category} ${account} ${expense.note}`.toLowerCase().includes(normalized);
  });
}
