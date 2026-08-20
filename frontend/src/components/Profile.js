import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { User, DollarSign, Bot, Save, AlertCircle, CheckCircle } from 'lucide-react';
import './Profile.css';

const Profile = () => {
  const { user, login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    phone: '',
    dob: '',
    country: 'India',
    avatar: '',
    
    monthlyIncomeRange: 'Not specified',
    monthlyBudget: '',
    savingsGoal: '',
    primaryFinancialGoal: 'Save money',
    budgetPeriod: 'Monthly',
    
    aiCoachEnabled: true,
    riskPreference: 'Moderate',
    adviceStyle: 'Detailed',
    aiNotifications: {
      weeklySummary: true,
      budgetWarnings: true,
      savingsSuggestions: true
    }
  });

  useEffect(() => {
    if (user) {
      const fetchProfile = async () => {
        try {
          const data = await api.getProfile();
          const u = data.user;
          setFormData({
            name: u.name || '',
            username: u.username || '',
            email: u.email || '',
            phone: u.phone || '',
            dob: u.dob ? u.dob.split('T')[0] : '',
            country: u.country || 'India',
            avatar: u.avatar || '',
            
            monthlyIncomeRange: u.financialPreferences?.monthlyIncomeRange || 'Not specified',
            monthlyBudget: u.financialPreferences?.monthlyBudget || '',
            savingsGoal: u.financialPreferences?.savingsGoal || '',
            primaryFinancialGoal: u.financialPreferences?.primaryFinancialGoal || 'Save money',
            budgetPeriod: u.financialPreferences?.budgetPeriod || 'Monthly',
            
            aiCoachEnabled: u.aiPreferences?.aiCoachEnabled !== false,
            riskPreference: u.aiPreferences?.riskPreference || 'Moderate',
            adviceStyle: u.aiPreferences?.adviceStyle || 'Detailed',
            aiNotifications: {
              weeklySummary: u.aiPreferences?.notifications?.weeklySummary !== false,
              budgetWarnings: u.aiPreferences?.notifications?.budgetWarnings !== false,
              savingsSuggestions: u.aiPreferences?.notifications?.savingsSuggestions !== false
            }
          });
        } catch (error) {
          console.error("Failed to fetch profile", error);
        }
      };
      fetchProfile();
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.startsWith('aiNotifications.')) {
      const key = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        aiNotifications: {
          ...prev.aiNotifications,
          [key]: checked
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    
    try {
      const payload = {
        name: formData.name,
        username: formData.username,
        phone: formData.phone,
        dob: formData.dob || undefined,
        country: formData.country,
        avatar: formData.avatar,
        financialPreferences: {
          monthlyIncomeRange: formData.monthlyIncomeRange,
          monthlyBudget: Number(formData.monthlyBudget),
          savingsGoal: Number(formData.savingsGoal),
          primaryFinancialGoal: formData.primaryFinancialGoal,
          budgetPeriod: formData.budgetPeriod
        },
        aiPreferences: {
          aiCoachEnabled: formData.aiCoachEnabled,
          riskPreference: formData.riskPreference,
          adviceStyle: formData.adviceStyle,
          notifications: formData.aiNotifications
        }
      };

      const res = await api.updateProfile(payload);
      setMessage({ type: 'success', text: 'Profile saved successfully!' });
      
      // Update AuthContext user
      login(res.token || localStorage.getItem('fintrack_token'), res.user);
      
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Failed to save profile' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-page">
      {message && (
        <div className={`profile-alert alert-${message.type}`}>
          {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span>{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="profile-form">
        
        {/* Section 1: Personal Information */}
        <section className="profile-section card">
          <div className="section-header">
            <User className="section-icon" />
            <h2>Personal Information</h2>
          </div>
          
          <div className="form-grid">
            
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} className="form-input" required />
            </div>
            
            <div className="form-group">
              <label className="form-label">Username</label>
              <input type="text" name="username" value={formData.username} onChange={handleChange} className="form-input" />
            </div>

            <div className="form-group">
              <label className="form-label">Email (Read Only)</label>
              <input type="email" value={formData.email} className="form-input disabled" disabled />
            </div>
            
            <div className="form-group">
              <label className="form-label">Phone Number (Optional)</label>
              <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="form-input" />
            </div>
            
            <div className="form-group">
              <label className="form-label">Date of Birth (Optional)</label>
              <input type="date" name="dob" value={formData.dob} onChange={handleChange} className="form-input" />
            </div>

            <div className="form-group">
              <label className="form-label">Country</label>
              <select name="country" value={formData.country} onChange={handleChange} className="form-select">
                <option value="India">India</option>
                <option value="USA">USA</option>
                <option value="UK">UK</option>
                <option value="UAE">UAE</option>
                <option value="Australia">Australia</option>
                <option value="Canada">Canada</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
        </section>

        {/* Section 2: Financial Preferences */}
        <section className="profile-section card">
          <div className="section-header">
            <DollarSign className="section-icon" />
            <h2>Financial Preferences</h2>
          </div>
          
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Monthly Income Range</label>
              <select name="monthlyIncomeRange" value={formData.monthlyIncomeRange} onChange={handleChange} className="form-select">
                <option value="Not specified">Not specified</option>
                <option value="Under ₹25,000">Under ₹25,000</option>
                <option value="₹25,000 - ₹50,000">₹25,000 - ₹50,000</option>
                <option value="₹50,000 - ₹1,00,000">₹50,000 - ₹1,00,000</option>
                <option value="₹1,00,000 - ₹2,50,000">₹1,00,000 - ₹2,50,000</option>
                <option value="Above ₹2,50,000">Above ₹2,50,000</option>
              </select>
            </div>
            
            <div className="form-group">
              <label className="form-label">Target Monthly Budget (₹)</label>
              <input type="number" name="monthlyBudget" value={formData.monthlyBudget} onChange={handleChange} className="form-input" placeholder="e.g. 40000" />
            </div>

            <div className="form-group">
              <label className="form-label">Savings Goal (₹)</label>
              <input type="number" name="savingsGoal" value={formData.savingsGoal} onChange={handleChange} className="form-input" placeholder="e.g. 100000" />
            </div>

            <div className="form-group">
              <label className="form-label">Preferred Budget Period</label>
              <select name="budgetPeriod" value={formData.budgetPeriod} onChange={handleChange} className="form-select">
                <option value="Monthly">Monthly</option>
                <option value="Weekly">Weekly</option>
              </select>
            </div>
            
            <div className="form-group full-width">
              <label className="form-label">Primary Financial Goal</label>
              <div className="radio-group">
                {['Save money', 'Reduce expenses', 'Build emergency fund', 'Invest', 'Pay off debt'].map(goal => (
                  <label key={goal} className="radio-label">
                    <input type="radio" name="primaryFinancialGoal" value={goal} checked={formData.primaryFinancialGoal === goal} onChange={handleChange} />
                    <span>{goal}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: AI Coach Preferences */}
        <section className="profile-section card">
          <div className="section-header">
            <Bot className="section-icon" />
            <h2>AI Coach Preferences</h2>
          </div>
          
          <div className="form-grid">
            <div className="form-group full-width toggle-group">
              <label className="toggle-label">
                <div>
                  <strong>Enable AI Coach</strong>
                  <p>Allow the FinTrack AI to analyze your transactions and offer insights.</p>
                </div>
                <input type="checkbox" name="aiCoachEnabled" checked={formData.aiCoachEnabled} onChange={handleChange} className="toggle-switch" />
              </label>
            </div>
            
            <div className="form-group">
              <label className="form-label">Risk Preference</label>
              <select name="riskPreference" value={formData.riskPreference} onChange={handleChange} className="form-select">
                <option value="Conservative">Conservative</option>
                <option value="Moderate">Moderate</option>
                <option value="Aggressive">Aggressive</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Advice Style</label>
              <select name="adviceStyle" value={formData.adviceStyle} onChange={handleChange} className="form-select">
                <option value="Short & direct">Short & direct</option>
                <option value="Detailed">Detailed</option>
                <option value="Educational">Educational</option>
              </select>
            </div>
            
            <div className="form-group full-width">
              <label className="form-label">AI Notifications</label>
              <div className="checkbox-group">
                <label className="checkbox-label">
                  <input type="checkbox" name="aiNotifications.weeklySummary" checked={formData.aiNotifications.weeklySummary} onChange={handleChange} />
                  Weekly spending summary
                </label>
                <label className="checkbox-label">
                  <input type="checkbox" name="aiNotifications.budgetWarnings" checked={formData.aiNotifications.budgetWarnings} onChange={handleChange} />
                  Budget warnings
                </label>
                <label className="checkbox-label">
                  <input type="checkbox" name="aiNotifications.savingsSuggestions" checked={formData.aiNotifications.savingsSuggestions} onChange={handleChange} />
                  Savings suggestions
                </label>
              </div>
            </div>
          </div>
        </section>

        <div className="profile-actions">
          <button type="submit" className="btn btn-primary profile-submit" disabled={loading}>
            {loading ? 'Saving...' : <><Save size={18} /> Save Profile</>}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Profile;
