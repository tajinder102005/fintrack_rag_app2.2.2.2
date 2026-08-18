const DEFAULT_MODEL = 'gemini-2.5-flash';
const FALLBACK_MODELS = [
  'gemini-2.5-flash',
  'gemini-flash-latest',
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash-lite'
];

function getApiKey() {
  return process.env.GEMINI_API_KEY?.trim() || '';
}

function getModel() {
  return process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL;
}

function isConfigured() {
  return Boolean(getApiKey());
}

function isQuotaError(status, message = '') {
  return status === 429 || /quota|rate.?limit|resource exhausted/i.test(message);
}

async function callModel(model, apiKey, body) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error('Invalid response from Gemini API');
  }

  if (!response.ok) {
    const message = data?.error?.message || `Gemini API error (${response.status})`;
    const err = new Error(message);
    err.status = response.status;
    err.isQuota = isQuotaError(response.status, message);
    throw err;
  }

  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text?.trim()) {
    throw new Error('Empty response from Gemini');
  }

  return text.trim();
}

/**
 * @param {{ systemPrompt: string, contents: Array<{ role: 'user'|'model', parts: Array<{ text: string }> }> }} options
 */
async function generateReply({ systemPrompt, contents }) {
  const apiKey = getApiKey();
  if (!apiKey) {
    const err = new Error('Gemini API key is not configured');
    err.code = 'GEMINI_NOT_CONFIGURED';
    throw err;
  }

  const body = {
    systemInstruction: { parts: [{ text: systemPrompt }] },
    contents,
    generationConfig: {
      temperature: 0.65,
      maxOutputTokens: 1200
    }
  };

  const preferred = getModel();
  const modelsToTry = [...new Set([preferred, ...FALLBACK_MODELS])];
  let lastError;

  for (const model of modelsToTry) {
    try {
      return await callModel(model, apiKey, body);
    } catch (error) {
      lastError = error;
      if (error.isQuota) {
        console.warn(`Gemini model ${model} quota exceeded, trying next...`);
        continue;
      }
      throw error;
    }
  }

  throw lastError || new Error('All Gemini models failed');
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

function buildPersonalizedSystem(context) {
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

  if (context.budgets?.length) {
    lines.push('Current month budgets:');
    context.budgets.forEach(b => {
      const pct = b.limit > 0 ? Math.round((b.spent / b.limit) * 100) : 0;
      lines.push(`  - ${b.category}: spent ₹${Number(b.spent || 0).toLocaleString('en-IN')} of ₹${Number(b.limit || 0).toLocaleString('en-IN')} (${pct}%)`);
    });
  } else {
    lines.push('No budgets set for the current month.');
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
