const DEFAULT_MODEL = 'openai/gpt-oss-20b';
const FALLBACK_MODELS = [
  'openai/gpt-oss-20b',
  'qwen/qwen3.6-27b',
  'groq/compound-mini'
];

function getApiKey() {
  return process.env.GROQ_API_KEY?.trim() || '';
}

function getModel() {
  return process.env.GROQ_MODEL?.trim() || DEFAULT_MODEL;
}

function isConfigured() {
  return Boolean(getApiKey());
}

function shouldFallback(status, message = '') {
  // Fallback if quota exceeded (429), server error (5xx), or model not found (404)
  return status === 429 || status === 404 || status >= 500 || /quota|rate.?limit/i.test(message);
}

async function callModel(model, apiKey, systemPrompt, contents) {
  const messages = [
    { role: 'system', content: systemPrompt },
    ...contents
  ];

  const body = {
    model: model,
    messages: messages,
    temperature: 0.65,
    max_tokens: 2500
  };

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(body)
  });

  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error('Invalid response from Groq API');
  }

  if (!response.ok) {
    const message = data?.error?.message || `Groq API error (${response.status})`;
    const err = new Error(message);
    err.status = response.status;
    err.shouldFallback = shouldFallback(response.status, message);
    throw err;
  }

  const text = data?.choices?.[0]?.message?.content;
  if (!text?.trim()) {
    throw new Error('Empty response from Groq');
  }

  // Remove <think> blocks (often produced by reasoning models like Qwen)
  let cleanText = text.replace(/<think>[\s\S]*?<\/think>/g, '');
  return cleanText.trim();
}

/**
 * @param {{ systemPrompt: string, contents: Array<{ role: 'user'|'model', parts: Array<{ text: string }> }> }} options
 */
async function generateReply({ systemPrompt, contents }) {
  const apiKey = getApiKey();
  if (!apiKey) {
    const err = new Error('Groq API key is not configured');
    err.code = 'GROQ_NOT_CONFIGURED';
    throw err;
  }

  // Convert Gemini's parts array format to OpenAI's standard string format
  const formattedContents = contents.map(m => ({
    role: m.role === 'model' ? 'assistant' : 'user',
    content: m.parts[0].text
  }));

  const preferred = getModel();
  const modelsToTry = [...new Set([preferred, ...FALLBACK_MODELS])];
  let lastError;

  for (const model of modelsToTry) {
    try {
      return await callModel(model, apiKey, systemPrompt, formattedContents);
    } catch (error) {
      lastError = error;
      if (error.shouldFallback) {
        console.warn(`Groq model ${model} failed, trying next...`);
        continue;
      }
      throw error;
    }
  }

  throw lastError || new Error('All Groq models failed');
}

/** @param {Array<{ role: 'user'|'ai', text: string }>} history */
function historyToContents(history, message) {
  const contents = (history || [])
    .filter(m => m?.text?.trim())
    .slice(-10)
    .map(m => ({
      role: m.role === 'ai' ? 'model' : 'user',
      parts: [{ text: m.text.trim() }]
    }));

  contents.push({
    role: 'user',
    parts: [{ text: message.trim() }]
  });

  return contents;
}

const BASE_SYSTEM = `You are FinTrack AI — an expert personal finance coach for users in India.

Guidelines:
- Give practical, actionable advice in clear language (use ₹ for amounts).
- Cover budgeting, saving, investing (SIP, mutual funds, stocks), EMIs, loans, insurance, tax (80C, 80D, NPS), emergency funds, and spending habits.
- When user financial data is provided, personalize answers using their numbers; never invent balances they did not share.
- Use short paragraphs or bullet points when helpful. You may use **bold** for emphasis.
- Include a brief disclaimer when giving investment or tax guidance: not a substitute for a licensed CA/SEBI advisor.
- Stay on topic: personal finance only. Politely decline unrelated requests.`;

function buildPersonalizedSystem(context, user = null) {
  if (!context || typeof context !== 'object') {
    return `${BASE_SYSTEM}\n\nNo personal FinTrack data was shared for this session. Give general India-focused advice and suggest logging transactions in the app for personalized insights.`;
  }

  const lines = [
    BASE_SYSTEM,
    '',
    '--- User FinTrack snapshot (use for personalization) ---',
    `Name: ${context.userName || 'User'}`,
    `Transactions logged: ${context.transactionCount ?? 0}`,
    `Balance: ₹${Number(context.balance || 0).toLocaleString('en-IN')}`,
    `Total income (logged): ₹${Number(context.income || 0).toLocaleString('en-IN')}`,
    `Total expenses (logged): ₹${Number(context.expenses || 0).toLocaleString('en-IN')}`,
    `Savings rate: ${Number(context.savingsRate || 0).toFixed(1)}%`
  ];

  if (context.topCategories?.length) {
    lines.push('Top expense categories:');
    context.topCategories.forEach(c => {
      lines.push(`  - ${c.name}: ₹${Number(c.expense || 0).toLocaleString('en-IN')}`);
    });
  }

  if (context.topIncomeCategories?.length) {
    lines.push('Top income categories:');
    context.topIncomeCategories.forEach(c => {
      lines.push(`  - ${c.name}: ₹${Number(c.income || 0).toLocaleString('en-IN')}`);
    });
  }

  if (context.budgets?.length) {
    lines.push('Current month budgets:');
    context.budgets.forEach(b => {
      const pct = b.limit > 0 ? Math.round((b.spent / b.limit) * 100) : 0;
      lines.push(`  - ${b.category}: spent ₹${Number(b.spent || 0).toLocaleString('en-IN')} of ₹${Number(b.limit || 0).toLocaleString('en-IN')} (${pct}%)`);
    });
  } else {
    lines.push('No budgets set for the current month.');
  }

  if (user) {
    lines.push('');
    lines.push('--- Personal Profile ---');
    lines.push(`Name: ${user.name || context.userName || 'User'}`);
    if (user.username) lines.push(`Username: ${user.username}`);
    if (user.country) lines.push(`Country: ${user.country}`);
    if (user.dob) {
      const age = new Date().getFullYear() - new Date(user.dob).getFullYear();
      lines.push(`Age: ~${age} years old`);
    }

    if (user.financialPreferences) {
      lines.push('');
      lines.push('--- Financial Profile & Goals ---');
      lines.push(`Monthly Income Range: ${user.financialPreferences.monthlyIncomeRange}`);
      lines.push(`Target Monthly Budget: ₹${user.financialPreferences.monthlyBudget}`);
      lines.push(`Savings Goal: ₹${user.financialPreferences.savingsGoal}`);
      lines.push(`Primary Goal: ${user.financialPreferences.primaryFinancialGoal}`);
    }
    
    if (user.aiPreferences) {
      lines.push('');
      lines.push('--- AI Coach Interaction Preferences ---');
      lines.push(`Risk Preference: ${user.aiPreferences.riskPreference}`);
      lines.push(`Advice Style: ${user.aiPreferences.adviceStyle} (ensure your response strongly matches this style)`);
    }
  }

  return lines.join('\n');
}

module.exports = {
  isConfigured,
  generateReply,
  historyToContents,
  buildPersonalizedSystem,
  BASE_SYSTEM
};
