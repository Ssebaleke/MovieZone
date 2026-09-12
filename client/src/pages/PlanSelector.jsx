import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, CreditCard, Lock } from 'lucide-react';
import { api } from '../utils/api';

const PLANS = [
  {
    id: 'BASIC',
    name: 'Basic',
    price: 'US$2.99',
    resolution: '720p (HD)',
    screens: '1 screen',
    quality: 'Good video quality'
  },
  {
    id: 'STANDARD',
    name: 'Standard',
    price: 'US$5.99',
    resolution: '1080p (Full HD)',
    screens: '2 screens',
    quality: 'Better video quality'
  },
  {
    id: 'PREMIUM',
    name: 'Premium',
    price: 'US$9.99',
    resolution: '4K + HDR',
    screens: '4 screens',
    quality: 'Best video quality'
  }
];

export default function PlanSelector() {
  const [selectedPlan, setSelectedPlan] = useState('STANDARD');
  const [showPayment, setShowPayment] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleCheckoutInit = async () => {
    try {
      setLoading(true);
      const res = await api.post('/billing/checkout', { plan: selectedPlan });
      if (res.stripeEnabled && res.url) {
        window.location.href = res.url;
      } else {
        setShowPayment(true);
      }
    } catch (err) {
      setError(err.message || 'Error initializing payment gateway');
    } finally {
      setLoading(false);
    }
  };

  const handleMockPaymentSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/billing/mock-checkout', {
        plan: selectedPlan,
        cardNumber,
        expiry,
        cvc
      });

      if (res.success) {
        const stored = JSON.parse(localStorage.getItem('netflix_user') || '{}');
        stored.plan = selectedPlan;
        stored.subscriptionStatus = 'ACTIVE';
        localStorage.setItem('netflix_user', JSON.stringify(stored));
        navigate('/profiles');
      }
    } catch (err) {
      setError(err.message || 'Mock transaction failed. Check card details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: '#141414', minHeight: '100vh', color: '#fff' }}>
      <div className="auth-header" style={{ borderBottom: '1px solid #222' }}>
        <div className="logo" style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>
          <img src="/movie-zone-logo.svg" alt="Movie Zone" style={{ height: '42px', width: 'auto' }} />
        </div>
        <button className="auth-btn" style={{ background: 'transparent', border: '1px solid #555' }} onClick={() => {
          localStorage.removeItem('netflix_token');
          localStorage.removeItem('netflix_user');
          navigate('/login');
        }}>Sign Out</button>
      </div>

      <div className="plan-selection-container">
        <div className="plan-header">
          <h1>Choose the Movie Zone plan that's right for you</h1>
          <p>Watch all Ugandan VJs and global blockbusters. Cancel anytime.</p>
        </div>

        {error && <div className="error-message" style={{ textAlign: 'center', marginBottom: '24px', fontSize: '1.1rem' }}>{error}</div>}

        <div className="plans-grid">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`plan-card ${selectedPlan === plan.id ? 'selected' : ''}`}
              onClick={() => setSelectedPlan(plan.id)}
            >
              {selectedPlan === plan.id && <span className="plan-badge">Selected</span>}
              <h3 className="plan-name">{plan.name}</h3>
              <div className="plan-price">{plan.price}<span>/month</span></div>
              <ul className="plan-features">
                <li><span>Resolution</span> <span>{plan.resolution}</span></li>
                <li><span>Screens</span> <span>{plan.screens}</span></li>
                <li><span>Video Quality</span> <span>{plan.quality}</span></li>
              </ul>
            </div>
          ))}
        </div>

        <button className="auth-btn plan-select-btn" onClick={handleCheckoutInit} disabled={loading} style={{ background: '#e50914' }}>
          {loading ? 'Initializing...' : 'Next'}
        </button>
      </div>

      {showPayment && (
        <div className="payment-modal-overlay">
          <div className="payment-modal-card">
            <h3>Complete Membership Billing</h3>
            <p>Enter payment details or Mobile Money info to subscribe to <strong>{selectedPlan}</strong> plan.</p>
            
            {error && <span className="error-message" style={{ marginBottom: '16px', display: 'block' }}>{error}</span>}

            <form onSubmit={handleMockPaymentSubmit} className="cc-inputs">
              <div className="cc-input-container">
                <label>Card / Mobile Money Number</label>
                <input
                  type="text"
                  placeholder="256 700 000 000 or 4242 4242..."
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  required
                />
              </div>

              <div className="cc-row">
                <div className="cc-input-container" style={{ flex: 1 }}>
                  <label>Expiry Date</label>
                  <input
                    type="text"
                    placeholder="MM/YY"
                    value={expiry}
                    onChange={(e) => setExpiry(e.target.value)}
                    required
                  />
                </div>
                <div className="cc-input-container" style={{ flex: 1 }}>
                  <label>CVC</label>
                  <input
                    type="text"
                    placeholder="123"
                    value={cvc}
                    onChange={(e) => setCvc(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="payment-actions">
                <button type="button" className="payment-cancel" onClick={() => setShowPayment(false)}>Cancel</button>
                <button type="submit" className="payment-confirm" disabled={loading} style={{ background: '#e50914' }}>
                  {loading ? 'Processing...' : 'Subscribe Now'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
