import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { api } from '../services/api';
import { getAIResponse } from '../utils/aiAdvisor';
import { buildFinanceContext } from '../utils/buildFinanceContext';
import './AIAdvisor.css';

const CHIPS = [
  "What's my balance?",
  'Am I over budget?',
  'How to save ₹1L?',
  'SIP advice for my income',
  'Where am I spending most?'
];

const AIAdvisor = () => {
  const { user } = useAuth();
  const data = useData();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'ai',
      text: `Hi ${user?.name?.split(' ')[0] || 'there'}! I'm your FinTrack AI coach powered by Gemini. Ask about budgets, SIP, EMIs, tax, or your spending — in ₹.`
    }
  ]);
  const chatRef = useRef(null);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages, open, loading]);

  const getFallbackReply = (question) =>
    getAIResponse(question, {
      ...data,
      userName: user?.name?.split(' ')[0] || 'there'
    });

  const send = async (text) => {
    const question = (text || input).trim();
    if (!question || loading) return;

    const history = messages.filter(m => m.role === 'user' || m.role === 'ai');
    setMessages(prev => [...prev, { role: 'user', text: question }]);
    setInput('');
    setLoading(true);

    try {
      const context = buildFinanceContext(
        data,
        user?.name?.split(' ')[0] || 'there'
      );
      const { reply } = await api.askAdvisor({
        message: question,
        history,
        context
      });
      setMessages(prev => [...prev, { role: 'ai', text: reply }]);
    } catch (err) {
      const fallback = getFallbackReply(question);
      const note =
        err.message?.includes('GEMINI') || err.message?.includes('configured')
          ? '\n\n_(Using offline coach — add GEMINI_API_KEY to .env for full AI.)_'
          : '\n\n_(Gemini unavailable — showing offline answer.)_';
      setMessages(prev => [
        ...prev,
        { role: 'ai', text: fallback + note }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const renderText = (text) =>
    text.split('\n').map((line, i) => (
      <span key={i}>
        {line.split(/(\*\*[^*]+\*\*)/g).map((part, j) =>
          part.startsWith('**') ? <strong key={j}>{part.slice(2, -2)}</strong> : part
        )}
        {i < text.split('\n').length - 1 && <br />}
      </span>
    ));

  return (
    <>
      <button
        type="button"
        className={`ai-fab ${open ? 'ai-fab-hidden' : ''}`}
        onClick={() => setOpen(true)}
        aria-label="Open AI advisor"
      >
        <MessageCircle size={22} />
        <span>AI Coach</span>
      </button>

      {open && (
        <div className="ai-panel">
          <div className="ai-panel-header">
            <div>
              <h3>🧠 FinTrack AI</h3>
              <p>Gemini · Money coach for India · ₹</p>
            </div>
            <button type="button" className="ai-close" onClick={() => setOpen(false)}>
              <X size={20} />
            </button>
          </div>

          <div className="ai-chips">
            {CHIPS.map(chip => (
              <button
                key={chip}
                type="button"
                className="ai-chip"
                onClick={() => send(chip)}
                disabled={loading}
              >
                {chip}
              </button>
            ))}
          </div>

          <div className="ai-messages" ref={chatRef}>
            {messages.map((msg, i) => (
              <div key={i} className={`ai-msg ${msg.role}`}>
                <div className="ai-msg-bubble">{renderText(msg.text)}</div>
              </div>
            ))}
            {loading && (
              <div className="ai-msg ai">
                <div className="ai-msg-bubble ai-typing">
                  <span className="ai-dot" />
                  <span className="ai-dot" />
                  <span className="ai-dot" />
                </div>
              </div>
            )}
          </div>

          <div className="ai-input-row">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
              placeholder="Ask about SIP, budget, tax..."
              disabled={loading}
            />
            <button type="button" onClick={() => send()} aria-label="Send" disabled={loading}>
              <Send size={18} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default AIAdvisor;
