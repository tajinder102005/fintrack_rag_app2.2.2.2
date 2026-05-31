import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api } from '../services/api';
import './Home.css';

const Home = () => {
  const cursorRef = useRef(null);
  const ringRef = useRef(null);
  const particlesRef = useRef(null);
  const chatWindowRef = useRef(null);
  const aiInputRef = useRef(null);
  const [isSending, setIsSending] = useState(false);
  const [stats, setStats] = useState({ s1: 0, s2: 0, s3: 0 });
  const [chatHistory, setChatHistory] = useState([]);

  // CURSOR & ANIMATIONS
  useEffect(() => {
    let mx = 0, my = 0, rx = 0, ry = 0;

    const mouseMove = (e) => {
      mx = e.clientX;
      my = e.clientY;
      if (cursorRef.current) {
        cursorRef.current.style.left = mx + 'px';
        cursorRef.current.style.top = my + 'px';
      }
    };

    const animRing = () => {
      rx += (mx - rx) * 0.12;
      ry += (my - ry) * 0.12;
      if (ringRef.current) {
        ringRef.current.style.left = rx + 'px';
        ringRef.current.style.top = ry + 'px';
      }
      requestAnimationFrame(animRing);
    };

    document.addEventListener('mousemove', mouseMove);
    const ringAnimFrame = requestAnimationFrame(animRing);

    const interactiveEls = document.querySelectorAll('a, button, .chip, .feat-card, .testi, .plan, .fcard');
    interactiveEls.forEach(el => {
      el.addEventListener('mouseenter', () => {
        if (ringRef.current) {
          ringRef.current.style.width = '56px';
          ringRef.current.style.height = '56px';
          ringRef.current.style.opacity = '0.6';
        }
      });
      el.addEventListener('mouseleave', () => {
        if (ringRef.current) {
          ringRef.current.style.width = '36px';
          ringRef.current.style.height = '36px';
          ringRef.current.style.opacity = '0.4';
        }
      });
    });

    // PARTICLES
    if (particlesRef.current) {
      for (let i = 0; i < 28; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        const sz = Math.random() * 3 + 1;
        const isAccent = Math.random() > 0.5;
        p.style.cssText = `width:${sz}px;height:${sz}px;left:${Math.random() * 100}%;top:${Math.random() * 100}%;background:${isAccent ? 'rgba(0,255,224,' : 'rgba(0,145,255,'}${(Math.random() * 0.3 + 0.1)});animation:particleFloat ${Math.random() * 20 + 15}s linear ${Math.random() * 15}s infinite;`;
        particlesRef.current.appendChild(p);
      }

      const pStyle = document.createElement('style');
      pStyle.textContent = `@keyframes particleFloat{0%{transform:translateY(0) translateX(0) scale(1);opacity:0;}10%{opacity:1;}90%{opacity:1;}100%{transform:translateY(-${window.innerHeight + 100}px) translateX(${Math.random() * 200 - 100}px) scale(0.5);opacity:0;}}`;
      document.head.appendChild(pStyle);
    }

    // STATS COUNTER
    const animCount = (targetKey, target, dur) => {
      let start = 0;
      const step = Math.ceil(target / (dur / 16));
      const t = setInterval(() => {
        start = Math.min(start + step, target);
        setStats(prev => ({ ...prev, [targetKey]: start }));
        if (start >= target) clearInterval(t);
      }, 16);
    };

    const observer = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          animCount('s1', 84200, 1800);
          animCount('s2', 18, 1600);
          animCount('s3', 2100000, 2000);
          observer.disconnect();
        }
      });
    }, { threshold: 0.3 });

    const statsEl = document.getElementById('s1');
    if (statsEl) observer.observe(statsEl);

    return () => {
      document.removeEventListener('mousemove', mouseMove);
      cancelAnimationFrame(ringAnimFrame);
      observer.disconnect();
    };
  }, []);

  // AI CHAT LOGIC
  const addMsg = (role, content) => {
    const chatWindow = chatWindowRef.current;
    if (!chatWindow) return;
    const div = document.createElement('div');
    div.className = 'msg ' + (role === 'ai' ? 'ai' : 'user');
    div.innerHTML = `<div class="msg-avatar ${role === 'ai' ? 'ai' : 'user'}">${role === 'ai' ? '🧠' : '👤'}</div><div class="msg-bubble ${role === 'user' ? 'user-bubble' : ''}">${content}</div>`;
    chatWindow.appendChild(div);
    chatWindow.scrollTop = chatWindow.scrollHeight;
  };

  const addTyping = () => {
    const chatWindow = chatWindowRef.current;
    if (!chatWindow) return;
    const div = document.createElement('div');
    div.className = 'msg ai';
    div.id = 'typingIndicator';
    div.innerHTML = '<div class="msg-avatar ai">🧠</div><div class="msg-bubble"><div class="typing-dots"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div></div>';
    chatWindow.appendChild(div);
    chatWindow.scrollTop = chatWindow.scrollHeight;
  };

  const removeTyping = () => {
    const t = document.getElementById('typingIndicator');
    if (t) t.remove();
  };

  const sendMessage = async (customText = null) => {
    const text = customText || aiInputRef.current.value.trim();
    if (!text || isSending) return;

    addMsg('user', text);
    if (!customText) aiInputRef.current.value = '';
    setIsSending(true);
    addTyping();

    const historyForApi = chatHistory;

    try {
      const { reply } = await api.askAdvisorPublic({
        message: text,
        history: historyForApi
      });
      removeTyping();
      addMsg('ai', reply.replace(/\n/g, '<br/>'));
      setChatHistory(prev => [
        ...prev,
        { role: 'user', text },
        { role: 'ai', text: reply }
      ]);
    } catch (err) {
      removeTyping();
      const hint = err.message?.includes('GEMINI')
        ? 'Add GEMINI_API_KEY to your server .env (see GEMINI_SETUP.md).'
        : 'Please try again in a moment.';
      addMsg('ai', `Oops — I had trouble connecting. ${hint} 🙏`);
    }
    setIsSending(false);
    if (chatWindowRef.current) chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
  };

  const handleChipClick = (text) => {
    if (aiInputRef.current) aiInputRef.current.value = text;
    sendMessage(text);
  };

  return (
    <div className="home-body">
      <div id="cursor" ref={cursorRef}></div>
      <div id="cursor-ring" ref={ringRef}></div>
      <div id="particles" ref={particlesRef}></div>

      {/* NAV */}
      <nav className="home-nav">
        <Link to="/" className="home-logo">Fin<span className="dot">Track</span></Link>
        <div className="nav-links">
          <a href="#features">Features</a>
          <a href="#ai">AI Advisor</a>
          <a href="#how">How It Works</a>
          <a href="#pricing">Pricing</a>
        </div>
        <div className="nav-cta">
          <Link to="/login" className="btn-ghost">Log In</Link>
          <Link to="/register" className="btn-pri">Get Started</Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-bg"></div>
        <div className="grid-overlay"></div>

        <div className="float-cards-wrap">
          <div className="fcard fcard-1">
            <div className="fcard-label">Net Worth</div>
            <div className="fcard-val green">₹8,42,500</div>
            <div className="fcard-up">▲ 12.4% this month</div>
          </div>
          <div className="fcard fcard-2">
            <div className="fcard-label">Savings Rate</div>
            <div className="fcard-val blue">34.2%</div>
            <div className="fcard-sub">Goal: 35%</div>
            <div className="sparkline">
              <div className="spark-bar" style={{ height: '40%' }}></div>
              <div className="spark-bar" style={{ height: '55%' }}></div>
              <div className="spark-bar" style={{ height: '48%' }}></div>
              <div className="spark-bar" style={{ height: '70%' }}></div>
              <div className="spark-bar" style={{ height: '60%' }}></div>
              <div className="spark-bar active" style={{ height: '85%' }}></div>
            </div>
          </div>
          <div className="fcard fcard-3">
            <div className="fcard-label">Monthly Spend</div>
            <div className="fcard-val red">₹32,140</div>
            <div className="fcard-down">▼ 8.1% vs last month</div>
          </div>
          <div className="fcard fcard-4">
            <div className="fcard-label">Investments</div>
            <div className="fcard-val gold">₹2,15,000</div>
            <div className="fcard-up">▲ Mutual Funds</div>
          </div>
          <div className="fcard fcard-5">
            <div className="fcard-label">EMI Left</div>
            <div className="fcard-val blue">18 months</div>
            <div className="fcard-sub">Home Loan</div>
          </div>
          <div className="fcard fcard-6">
            <div className="fcard-label">AI Insight</div>
            <div className="fcard-val green" style={{ fontSize: '14px', lineHeight: '1.4' }}>Cut dining by<br />₹4,000 to hit goal</div>
          </div>
        </div>

        <motion.div
          className="hero-badge"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <span className="pulse-dot"></span>
          AI-Powered Financial Intelligence
        </motion.div>

        <motion.h1
          className="home-h1"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          Your Money,<br />
          <motion.span
            className="gradient-text"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            Tracked
          </motion.span>
          {' '}
          &
          {' '}
          <motion.span
            className="gradient-text-2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            Grown
          </motion.span>
        </motion.h1>

        <motion.p
          className="hero-sub"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          FinTrack gives you a living dashboard of every rupee — with an AI advisor that actually understands your goals.
        </motion.p>

        <motion.div
          className="hero-actions"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
        >
          <Link to="/register" className="btn-hero">Start Free — No Card Needed</Link>
          <a href="#ai" className="btn-hero2">Ask the AI ↓</a>
        </motion.div>

        <motion.div
          className="stats-row"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.9 }}
        >
          <div className="stat-item"><div className="stat-num" id="s1">{stats.s1.toLocaleString()}+</div><div className="stat-lbl">Users tracking money</div></div>
          <div className="stat-item"><div className="stat-num" id="s2">{stats.s2}% avg</div><div className="stat-lbl">Avg. monthly savings boost</div></div>
          <div className="stat-item"><div className="stat-num" id="s3">{stats.s3.toLocaleString()}+</div><div className="stat-lbl">AI insights generated</div></div>
        </motion.div>
      </section>

      {/* FEATURES */}
      <section id="features" className="home-section">
        <div className="section-label">Core Features</div>
        <h2 className="section-title">Everything You Need<br />To Win With Money</h2>
        <p className="section-sub">From expense tracking to investment intelligence — built for the modern Indian household.</p>
        <div className="features-grid">
          <div className="feat-card">
            <div className="feat-icon">📊</div>
            <div className="feat-title">Smart Dashboard</div>
            <p className="feat-desc">Real-time overview of income, expenses, savings, and investments — all in one beautiful interface.</p>
          </div>
          <div className="feat-card">
            <div className="feat-icon blue">🤖</div>
            <div className="feat-title">AI Financial Advisor</div>
            <p className="feat-desc">Ask anything — budgeting, investment choices, EMI planning. Get personalized, context-aware answers instantly.</p>
          </div>
          <div className="feat-card">
            <div className="feat-icon gold">💰</div>
            <div className="feat-title">Goal Tracking</div>
            <p className="feat-desc">Set savings goals for home, travel, emergency fund, or retirement — and watch your progress with precision.</p>
          </div>
          <div className="feat-card">
            <div className="feat-icon">🔔</div>
            <div className="feat-title">Spend Alerts</div>
            <p className="feat-desc">Get notified when you're overspending in a category or drifting from your budget — before it's too late.</p>
          </div>
          <div className="feat-card">
            <div className="feat-icon blue">📈</div>
            <div className="feat-title">Investment Tracker</div>
            <p className="feat-desc">Link mutual funds, stocks, FDs, and crypto. See unified performance and net worth grow over time.</p>
          </div>
          <div className="feat-card">
            <div className="feat-icon gold">🔒</div>
            <div className="feat-title">Bank-Grade Security</div>
            <p className="feat-desc">256-bit encryption, 2FA, and read-only bank access. Your data is yours — always private, never sold.</p>
          </div>
        </div>
      </section>

      {/* AI ADVISOR */}
      <div className="ai-section" id="ai">
        <div className="ai-header">
          <div className="ai-icon-wrap">🧠</div>
          <div className="ai-head-text">
            <h2>Ask FinTrack AI Anything</h2>
            <p>Your personal financial advisor. Ask about budgets, investments, EMIs, savings strategies — get honest, smart answers in seconds.</p>
          </div>
        </div>

        <div className="prompt-chips">
          {["How do I save ₹1L in 6 months?", "Should I prepay my home loan?", "Best SIP amount for my salary?", "How to build an emergency fund?", "Tax saving options for salaried?", "Budget for ₹60k monthly income?"].map(chip => (
            <div key={chip} className="chip" onClick={() => handleChipClick(chip)}>{chip}</div>
          ))}
        </div>

        <div className="chat-window" id="chatWindow" ref={chatWindowRef}>
          <div className="msg ai">
            <div className="msg-avatar ai">🧠</div>
            <div className="msg-bubble">Hi! I'm your FinTrack AI advisor. Ask me anything about budgeting, saving, investing, or managing debt. I'll give you honest, actionable financial advice tailored to your situation. 💡</div>
          </div>
        </div>

        <div className="ai-input-row">
          <textarea
            className="ai-input"
            id="aiInput"
            ref={aiInputRef}
            rows="1"
            placeholder="Ask about your finances... e.g. How should I invest ₹5000/month?"
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
          ></textarea>
          <button className="ai-send" id="aiSend" onClick={() => sendMessage()} disabled={isSending}>Ask AI →</button>
        </div>
      </div>

      {/* HOW IT WORKS */}
      <section id="how" className="home-section">
        <div className="section-label">How It Works</div>
        <h2 className="section-title">Up &amp; Running<br />In 4 Steps</h2>
        <div className="steps">
          {[
            { num: 1, title: "Sign Up Free", desc: "Create your account in 60 seconds. No credit card, no commitments." },
            { num: 2, title: "Connect Accounts", desc: "Link your bank, UPI, and investment accounts securely via read-only access." },
            { num: 3, title: "Get Insights", desc: "Your AI advisor analyzes spending patterns and surfaces actionable insights immediately." },
            { num: 4, title: "Grow Wealth", desc: "Follow personalized goals and watch your net worth climb month over month." }
          ].map(step => (
            <div className="step" key={step.num}>
              <div className="step-num">{step.num}</div>
              <div className="step-title">{step.title}</div>
              <p className="step-desc">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="home-section">
        <div className="section-label">People Love It</div>
        <h2 className="section-title">Real Results,<br />Real People</h2>
        <div className="testimonials">
          <div className="testi">
            <div className="stars">★★★★★</div>
            <p className="testi-text">"The AI advisor told me I was losing ₹6,000/month on subscriptions I forgot about. Saved that in week one."</p>
            <div className="testi-author">
              <div className="testi-avatar">RK</div>
              <div><div className="testi-name">Rohit Kumar</div><div className="testi-role">Software Engineer, Bangalore</div></div>
            </div>
          </div>
          <div className="testi">
            <div className="stars">★★★★★</div>
            <p className="testi-text">"Finally hit my 6-month emergency fund goal because FinTrack made it visual and the AI kept nudging me. Life-changing."</p>
            <div className="testi-author">
              <div className="testi-avatar" style={{ background: 'rgba(0,145,255,0.12)', color: 'var(--home-accent2)' }}>PS</div>
              <div><div className="testi-name">Priya Sharma</div><div className="testi-role">Product Manager, Delhi</div></div>
            </div>
          </div>
          <div className="testi">
            <div className="stars">★★★★★</div>
            <p className="testi-text">"Asked the AI about SIP vs lump sum for my bonus — it gave me a better answer than my CA did. Stunning product."</p>
            <div className="testi-author">
              <div className="testi-avatar" style={{ background: 'rgba(255,209,102,0.12)', color: 'var(--home-gold)' }}>AM</div>
              <div><div className="testi-name">Arjun Mehta</div><div className="testi-role">Founder, Mumbai</div></div>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="home-section">
        <div className="section-label">Pricing</div>
        <h2 className="section-title">Simple, Transparent<br />Pricing</h2>
        <div className="pricing-grid">
          <div className="plan">
            <div className="plan-name">Starter</div>
            <div className="plan-price">₹0<span>/mo</span></div>
            <div className="plan-period">Free forever</div>
            <ul className="plan-features">
              <li>Manual expense tracking</li>
              <li>Basic dashboard</li>
              <li>3 savings goals</li>
              <li>10 AI questions/month</li>
              <li className="no">Bank sync</li>
              <li className="no">Investment tracking</li>
            </ul>
            <Link to="/register" className="plan-btn">Get Started Free</Link>
          </div>
          <div className="plan featured">
            <div className="plan-badge">MOST POPULAR</div>
            <div className="plan-name">Pro</div>
            <div className="plan-price">₹299<span>/mo</span></div>
            <div className="plan-period">Billed monthly · cancel anytime</div>
            <ul className="plan-features">
              <li>Auto bank sync (10 accounts)</li>
              <li>Full AI advisor — unlimited</li>
              <li>Unlimited savings goals</li>
              <li>Investment portfolio tracker</li>
              <li>Smart spend alerts</li>
              <li>Tax saving insights</li>
            </ul>
            <Link to="/register" className="plan-btn featured-btn">Start 14-Day Free Trial</Link>
          </div>
          <div className="plan">
            <div className="plan-name">Family</div>
            <div className="plan-price">₹499<span>/mo</span></div>
            <div className="plan-period">Up to 5 members</div>
            <ul className="plan-features">
              <li>Everything in Pro</li>
              <li>5 family member accounts</li>
              <li>Shared family budget</li>
              <li>Consolidated family net worth</li>
              <li>Priority AI advisor</li>
              <li>Dedicated support</li>
            </ul>
            <Link to="/register" className="plan-btn">Start Free Trial</Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <div className="cta-home-section">
        <div className="cta-bg"></div>
        <h2>Start Mastering<br />Your Money Today</h2>
        <p>Join thousands who've transformed their financial life with FinTrack's AI-powered insights.</p>
        <div className="cta-btns">
          <Link to="/register" className="btn-hero">Create Free Account →</Link>
          <a href="#ai" className="btn-hero2">Try AI Advisor First</a>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="home-footer">
        <div className="footer-logo">Fin<span className="dot">Track</span></div>
        <div className="footer-links">
          <a href="#">Privacy</a>
          <a href="#">Terms</a>
          <a href="#">Security</a>
          <a href="#">Blog</a>
          <a href="#">Contact</a>
        </div>
        <div className="footer-copy">© 2025 FinTrack. Built with 💚 in India.</div>
      </footer>
    </div>
  );
};

export default Home;
