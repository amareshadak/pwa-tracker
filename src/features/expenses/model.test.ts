import { describe, expect, it } from 'vitest';
import { searchExpenses } from './model';

describe('expense search', () => {
  it('searches across note, category and account', () => {
    const expenses = [{ id:'e1', amount:250, account_id:'a1', category_id:'c1', note:'Swiggy lunch', date:'2026-07-13' }];
    const categories = [{ id:'c1', name:'Food', icon:'', color:'', monthly_budget:0 }];
    const accounts = [{ id:'a1', name:'HDFC', type:'bank' as const, icon:'' }];
    expect(searchExpenses(expenses, 'food', categories, accounts)).toHaveLength(1);
    expect(searchExpenses(expenses, 'hdfc', categories, accounts)).toHaveLength(1);
    expect(searchExpenses(expenses, 'missing', categories, accounts)).toHaveLength(0);
  });
});
