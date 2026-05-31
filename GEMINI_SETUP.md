# Gemini AI Advisor Setup

FinTrack uses **Google Gemini** for the AI financial coach. The API key stays on the **server** only (never in React).

## 1. Get an API key

1. Open [Google AI Studio](https://aistudio.google.com/apikey)
2. Sign in with your Google account
3. Click **Create API key**
4. Copy the key

## 2. Add to `.env`

In the project root `.env` (same file as `MONGODB_URI`):

```env
GEMINI_API_KEY=your_api_key_here
# Optional — default is gemini-2.5-flash (auto-fallback if quota hit)
# GEMINI_MODEL=gemini-2.5-flash
```

## 3. Restart the server

```bash
npm run dev
```

Or restart only the backend:

```bash
npm run server
```

## 4. Verify

- Log in and open **AI Coach** (bottom-right). Ask: "What's my balance?"
- On the home page, use the demo AI chat in the hero section.

If the key is missing, the app falls back to built-in rule-based answers.

## Security

- Do **not** put `GEMINI_API_KEY` in `REACT_APP_*` variables
- Do **not** commit `.env` to git
- For production, restrict the key in Google Cloud (HTTP referrer / IP) if possible

## Troubleshooting

| Issue | Fix |
|--------|-----|
| "AI advisor is not configured" | Add `GEMINI_API_KEY` to `.env` and restart server |
| 429 / quota errors | Check billing/limits in Google AI Studio |
| Invalid API key | Regenerate key and update `.env` |
