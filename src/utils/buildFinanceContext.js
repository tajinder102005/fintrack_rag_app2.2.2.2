/** Build a compact snapshot for the AI advisor API */
export function buildFinanceContext(data, userName) {
  const transactions = data.transactions || [];
  const budgets = data.budgets || [];
  const balance = data.getTotalBalance?.() ?? 0;
  const income = data.getTotalIncome?.() ?? 0;
  const expenses = data.getTotalExpenses?.() ?? 0;
  const categories = data.getTransactionsByCategory?.() ?? {};

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const monthBudgets = budgets.filter(
    b => b.month === currentMonth && b.year === currentYear
  );

  const topCategories = Object.entries(categories)
    .filter(([, d]) => d.expense > 0)
    .sort((a, b) => b[1].expense - a[1].expense)
    .slice(0, 6)
    .map(([name, d]) => ({ name, expense: d.expense }));

  return {
    userName: userName || 'User',
    balance,
    income,
    expenses,
    savingsRate: income > 0 ? ((income - expenses) / income) * 100 : 0,
    transactionCount: transactions.length,
    topCategories,
    budgets: monthBudgets.map(b => ({
      category: b.category,
      limit: b.amount,
      spent: b.spent || 0
    }))
  };
}
