const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const groq = require('../services/groq');
const User = require('../models/User');

const router = express.Router();

function handleLLMError(res, error) {
  if (error.code === 'GROQ_NOT_CONFIGURED' || error.code === 'GEMINI_NOT_CONFIGURED') {
    return res.status(503).json({
      message: 'AI advisor is not configured. Add GROQ_API_KEY to your server .env file.',
      fallback: true
    });
  }

  console.error('LLM error:', error.message);
  const status = error.status === 429 ? 429 : 502;
  return res.status(status).json({
    message: error.message || 'AI service unavailable. Please try again.',
    fallback: true
  });
}

const { retrieveKnowledge } = require('../../services/ragService');

/** Authenticated chat with user's FinTrack data */
router.post('/chat', authMiddleware, async (req, res) => {
  try {
    const { message, history = [], context } = req.body;

    if (!message?.trim()) {
      return res.status(400).json({ message: 'Message is required' });
    }

    const user = await User.findById(req.user.userId);
    if (user?.aiPreferences?.aiCoachEnabled === false) {
      return res.status(403).json({ 
        message: 'AI Coach is disabled in your profile. Please enable it in Settings & Profile to chat.',
        fallback: true 
      });
    }

    if (!groq.isConfigured()) {
      return res.status(503).json({
        message: 'GROQ_API_KEY is not set on the server.',
        fallback: true
      });
    }

    // 1. Retrieve knowledge from Pinecone
    let educationalContext = '';
    let citations = [];
    try {
      const chunks = await retrieveKnowledge(message, 3);
      if (chunks.length > 0) {
        educationalContext = '\n\n--- EDUCATIONAL KNOWLEDGE BASE ---\nUse the following reference material to help answer the user if relevant:\n' + 
          chunks.map((c, i) => `[Source ${i + 1}: ${c.source}]\n${c.text}`).join('\n\n');
        
        // Extract unique sources for citation
        citations = Array.from(
          new Map(chunks.map(chunk => [chunk.source, { source: chunk.source, score: chunk.score }])).values()
        );
      }
    } catch (e) {
      console.warn("RAG retrieval failed, falling back to base knowledge:", e.message);
    }

    // 2. Build the system prompt
    let systemPrompt = groq.buildPersonalizedSystem(context, user);
    systemPrompt += educationalContext;

    // 3. Generate response
    const contents = groq.historyToContents(history, message);
    const reply = await groq.generateReply({ systemPrompt, contents });

    res.json({ reply, source: 'groq', citations });
  } catch (error) {
    return handleLLMError(res, error);
  }
});

/** Public demo chat on landing page (no personal data) */
router.post('/chat/public', async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!message?.trim()) {
      return res.status(400).json({ message: 'Message is required' });
    }

    if (!groq.isConfigured()) {
      return res.status(503).json({
        message: 'GROQ_API_KEY is not set on the server.',
        fallback: true
      });
    }

    const systemPrompt = `${groq.BASE_SYSTEM}

This is a public demo on the marketing page. The user is not logged in — no personal FinTrack data. Give general India-focused financial guidance. Encourage signing up to connect real spending data.`;

    const contents = groq.historyToContents(history, message);
    const reply = await groq.generateReply({ systemPrompt, contents });

    res.json({ reply, source: 'groq' });
  } catch (error) {
    return handleLLMError(res, error);
  }
});

router.get('/status', (req, res) => {
  res.json({ configured: groq.isConfigured() });
});

module.exports = router;
