const express = require('express');
const authMiddleware = require('../middleware/auth');
const gemini = require('../services/gemini');

const router = express.Router();

function handleGeminiError(res, error) {
  if (error.code === 'GEMINI_NOT_CONFIGURED') {
    return res.status(503).json({
      message: 'AI advisor is not configured. Add GEMINI_API_KEY to your server .env file.',
      fallback: true
    });
  }

  console.error('Gemini error:', error.message);
  const status = error.status === 429 ? 429 : 502;
  return res.status(status).json({
    message: error.message || 'AI service unavailable. Please try again.',
    fallback: true
  });
}

/** Authenticated chat with user's FinTrack data */
router.post('/chat', authMiddleware, async (req, res) => {
  try {
    const { message, history = [], context } = req.body;

    if (!message?.trim()) {
      return res.status(400).json({ message: 'Message is required' });
    }

    if (!gemini.isConfigured()) {
      return res.status(503).json({
        message: 'GEMINI_API_KEY is not set on the server.',
        fallback: true
      });
    }

    const systemPrompt = gemini.buildPersonalizedSystem(context);
    const contents = gemini.historyToContents(history, message);
    const reply = await gemini.generateReply({ systemPrompt, contents });

    res.json({ reply, source: 'gemini' });
  } catch (error) {
    return handleGeminiError(res, error);
  }
});

/** Public demo chat on landing page (no personal data) */
router.post('/chat/public', async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!message?.trim()) {
      return res.status(400).json({ message: 'Message is required' });
    }

    if (!gemini.isConfigured()) {
      return res.status(503).json({
        message: 'GEMINI_API_KEY is not set on the server.',
        fallback: true
      });
    }

    const systemPrompt = `${gemini.BASE_SYSTEM}

This is a public demo on the marketing page. The user is not logged in — no personal FinTrack data. Give general India-focused financial guidance. Encourage signing up to connect real spending data.`;

    const contents = gemini.historyToContents(history, message);
    const reply = await gemini.generateReply({ systemPrompt, contents });

    res.json({ reply, source: 'gemini' });
  } catch (error) {
    return handleGeminiError(res, error);
  }
});

router.get('/status', (req, res) => {
  res.json({ configured: gemini.isConfigured() });
});

module.exports = router;
