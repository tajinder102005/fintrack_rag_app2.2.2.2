import { formatINR } from './format';

export function getAIResponse(question, context) {
  const {
    transactions = [],
    budgets = [],
    getTotalBalance,
    getTotalIncome,
    getTotalExpenses,
    getTransactionsByCategory,
    userName = 'there'
  } = context;

  const q = question.toLowerCase().trim();
  const balance = getTotalBalance?.() ?? 0;
  const income = getTotalIncome?.() ?? 0;
  const expenses = getTotalExpenses?.() ?? 0;
  const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0;
  const categories = getTransactionsByCategory?.() ?? {};

  const now = new Date();
  const daysLeft = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - now.getDate();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const monthBudgets = budgets.filter(
    b => b.month === currentMonth && b.year === currentYear
  );

  if (!q) {
    return `Hi ${userName}! Ask me about your balance, budgets, SIP, EMI, or how to save more in India.`;
  }

  if (/balance|net worth|total money|how much (do i|have)/.test(q)) {
    if (transactions.length === 0) {
      return `You haven't added any transactions yet. Start by logging income and expenses — your balance will show up here automatically.`;
    }
    return `Your current balance is **${formatINR(balance)}**. Income: ${formatINR(income)} · Expenses: ${formatINR(expenses)} this period.`;
  }

  if (/budget|overspend|over budget|spending limit/.test(q)) {
    if (monthBudgets.length === 0) {
      return `No budgets set this month. Go to **Budget** and set limits for Food, Transport, etc. I'll warn you when you're close to the limit.`;
    }
    const over = monthBudgets.filter(b => (b.spent || 0) > b.amount);
    if (over.length > 0) {
      const lines = over.map(b =>
        `**${b.category}**: ${formatINR(b.spent)} of ${formatINR(b.amount)} (${Math.round((b.spent / b.amount) * 100)}%)`
      );
      return `You're over budget in:\n${lines.join('\n')}\nWith **${daysLeft} days** left this month, try pausing non-essential spends in these categories.`;
    }
    return `All budgets look good with **${daysLeft} days** left in the month. Keep tracking daily spends to stay on track.`;
  }

  if (/sip|invest|mutual fund|stock/.test(q)) {
    const suggested = income > 0 ? Math.round(income * 0.2) : 5000;
    return `For Indian investors, a common rule is **20% of income** toward investments. Based on your logged income, consider starting a SIP of around **${formatINR(suggested)}/month** in a diversified index fund. Always align with your goals and risk tolerance.`;
  }

  if (/emi|loan|home loan|prepay/.test(q)) {
    return `For EMIs in India: compare **prepayment vs investing** — if loan interest is above ~8–9%, prepaying often wins. Keep 3–6 months expenses as emergency fund before aggressive prepayment.`;
  }

  if (/save|saving|1l|1 lakh|emergency/.test(q)) {
    const monthlySave = income > 0 ? income - expenses : 0;
    if (monthlySave <= 0) {
      return `Your expenses match or exceed income. Review **Food** and **Entertainment** categories first — small cuts of ₹2,000–₹5,000/month add up fast.`;
    }
    const monthsTo1L = Math.ceil(100000 / monthlySave);
    return `You're saving about **${formatINR(monthlySave)}/month** (${savingsRate.toFixed(0)}% rate). At this pace, **₹1 lakh** is roughly **${monthsTo1L} months** away. Automate transfers on salary day.`;
  }

  if (/tax|80c|deduction/.test(q)) {
    return `Popular India tax savers: **PPF**, **ELSS** (₹1.5L under 80C), **NPS** (extra ₹50k), health insurance (80D). Plan before March — don't rush last-minute investments.`;
  }

  if (/food|dining|category|where.*spend/.test(q)) {
    const top = Object.entries(categories)
      .filter(([, d]) => d.expense > 0)
      .sort((a, b) => b[1].expense - a[1].expense)
      .slice(0, 3);
    if (top.length === 0) {
      return `No expense categories yet. Add a few transactions and I'll show where your money goes.`;
    }
    const lines = top.map(([cat, d]) => `**${cat}**: ${formatINR(d.expense)}`);
    return `Top spending categories:\n${lines.join('\n')}\nFocus on the top one first for quick wins.`;
  }

  if (/tip|advice|help|what should/.test(q)) {
    if (transactions.length === 0) {
      return `Start with three steps: 1) Log this month's income, 2) Set a **Food** budget, 3) Track every expense for 7 days. Small habits beat perfect plans.`;
    }
    if (savingsRate < 10) {
      return `Your savings rate is **${savingsRate.toFixed(0)}%** — aim for 20%+. Try the 50-30-20 rule: 50% needs, 30% wants, 20% savings/investments.`;
    }
    return `You're doing well at **${savingsRate.toFixed(0)}% savings**. Next: build a **6-month emergency fund**, then increase SIPs. Review subscriptions — they often hide ₹3,000–₹6,000/month.`;
  }

  return `I can help with balances, budgets, SIP, EMI, tax saving, and spending patterns — all in ₹ and tuned for India. Try: "What's my balance?" or "How can I save ₹1L?"`;
}
