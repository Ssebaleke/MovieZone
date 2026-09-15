import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, CreditCard, Smartphone, Zap } from 'lucide-react';
import { api } from '../utils/api';

export default function PlanSelector() {
  const [packages, setPackages] = useState([]);
  const [selectedPkgId, setSelectedPkgId] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('mobile_money');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showPayment, setShowPayment] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const navigate = useNavigate();

  useEffect(() => { fetchPackages(); }, []);

  const fetchPackages = async () => {
    setFetching(true);
    setError('');
    try {
      const data = await api.get('/billing/packages');
      const list = Array.isArray(data) ? data : [];
      setPackages(list);
      if (list.length > 0) setSelectedPkgId(list[0].id);
    } catch (err) {
      setError('Could not load subscription packages.');
    } finally {
      setFetching(false);
    }
  };

  const handleSubscribeSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPkgId) { setError('Please select a plan'); return; }
    if (paymentMethod === 'mobile_money' && !phoneNumber.trim()) {
      setError('Please enter your Mobile Money number (e.g. 077XXXXXXX)');
      return;
    }
    setError('');
    setLoading(true);
    setSuccessMsg('');
    try {
      const res = await api.post('/billing/subscribe-package', {
        packageId: selectedPkgId,
        paymentMethod,
        phoneNumber: phoneNumber.trim()
      });
      if (res.checkoutUrl) {
        setSuccessMsg('Redirecting to payment gateway...');
        setTimeout(() => { window.location.href = res.checkoutUrl; }, 600);
        return;
      }
      if (res.success && res.user) {
        const stored = JSON.parse(localStorage.getItem('netflix_user') || '{}');
        stored.plan = res.user.plan;
        stored.subscriptionStatus = res.user.subscriptionStatus;
        localStorage.setItem('netflix_user', JSON.stringify(stored));
        setSuccessMsg(`Payment successful! Subscribed to ${res.user.plan}.`);
        setTimeout(() => navigate('/profiles'), 1000);
      }
    } catch (err) {
      setError(err.message || 'Payment failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  const formatInterval = (str) => {
    if (!str) return '';
    const map = {
      '12_HOURS': '12 Hours', '24_HOURS': '24 Hours', 'DAILY': '24 Hours',
      '3_DAYS': '3 Days', '7_DAYS': '7 Days', 'WEEKLY': '7 Days',
      '14_DAYS': '14 Days', '30_DAYS': '30 Days', 'MONTHLY': '30 Days',
      '3_MONTHS': '3 Months', '6_MONTHS': '6 Months', 'YEARLY': '1 Year'
    };
    return map[str.toUpperCase()] || str.replace(/_/g, ' ');
  };

  const selectedPkg = packages.find(p => p.id === selectedPkgId);

  return (
    <div className="plans-page">
      {/* Header */}
      <div className="plans-page-header">
        <div className="logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <img src="/movie-zone-logo.svg" alt="MovieZone" className="logo-svg" />
        </div>
        <button className="plans-signout-btn" onClick={() => {
          localStorage.removeItem('netflix_token');
          localStorage.removeItem('netflix_user');
          navigate('/login');
        }}>Sign Out</button>
      </div>

      <div className="plans-body">
        <div style={{ textAlign: 'center' }}>
          <div className="plans-step-badge"><Zap size={13} /> STEP 2 OF 3</div>
          <h1 className="plans-heading">Choose the plan that's right for you</h1>
          <p className="plans-subheading">Watch all Ugandan VJs and global blockbusters. Cancel anytime.</p>
        </div>

        {error && <div className="plans-alert plans-alert--error">{error}</div>}
        {successMsg && <div className="plans-alert plans-alert--success"><Check size={16} /> {successMsg}</div>}

        {fetching ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#555' }}>Loading plans...</div>
        ) : (
          <>
            <div className="plans-grid">
              {packages.map((pkg) => {
                const isSelected = selectedPkgId === pkg.id;
                return (
                  <div
                    key={pkg.id}
                    className={`plan-tile ${isSelected ? 'plan-tile--selected' : ''}`}
                    onClick={() => setSelectedPkgId(pkg.id)}
                  >
                    {isSelected && <span className="plan-tile-selected-badge">SELECTED</span>}
                    <h3 className="plan-tile-name">{pkg.name}</h3>
                    <span className="plan-tile-interval">⏱ {formatInterval(pkg.interval)}</span>
                    <div className="plan-tile-price" style={{ color: isSelected ? '#ff6b6b' : '#fff' }}>
                      {pkg.price.toLocaleString()} <span>{pkg.currency}</span>
                    </div>
                    <p className="plan-tile-desc">{pkg.description || 'Full streaming access.'}</p>
                    <div className="plan-tile-specs">
                      <div className="plan-tile-spec-row">
                        <span>Resolution</span><span>{pkg.resolution}</span>
                      </div>
                      <div className="plan-tile-spec-row">
                        <span>Screens</span><span>{pkg.screens} {pkg.screens === 1 ? 'Screen' : 'Screens'}</span>
                      </div>
                      {pkg.features && (
                        <div style={{ color: '#555', fontSize: '0.78rem', marginTop: 4 }}>✓ {pkg.features}</div>
                      )}
                    </div>
                    <button className="plan-tile-select-btn">
                      {isSelected ? '✓ Selected' : 'Choose Plan'}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="plans-cta-row">
              <button
                className="plans-checkout-btn"
                onClick={() => setShowPayment(true)}
                disabled={!selectedPkgId}
              >
                Proceed to Checkout {selectedPkg ? `— ${selectedPkg.price.toLocaleString()} ${selectedPkg.currency}` : ''} →
              </button>
            </div>
          </>
        )}
      </div>

      {/* Payment Modal */}
      {showPayment && selectedPkg && (
        <div className="payment-modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowPayment(false)}>
          <div className="plans-payment-modal">
            <h3>Complete Payment</h3>
            <p>
              Subscribing to <strong style={{ color: '#fff' }}>{selectedPkg.name}</strong> —{' '}
              {selectedPkg.price.toLocaleString()} {selectedPkg.currency} / {formatInterval(selectedPkg.interval)}
            </p>

            {error && <div className="plans-alert plans-alert--error" style={{ marginBottom: 16 }}>{error}</div>}

            <form onSubmit={handleSubscribeSubmit}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
                Payment Method
              </label>
              <div className="payment-method-grid">
                <button
                  type="button"
                  className={`payment-method-btn ${paymentMethod === 'mobile_money' ? 'payment-method-btn--active' : ''}`}
                  onClick={() => setPaymentMethod('mobile_money')}
                >
                  <Smartphone size={16} color="#ff6b6b" /> Mobile Money
                </button>
                <button
                  type="button"
                  className={`payment-method-btn ${paymentMethod === 'card' ? 'payment-method-btn--active' : ''}`}
                  onClick={() => setPaymentMethod('card')}
                >
                  <CreditCard size={16} color="#ff6b6b" /> Card
                </button>
              </div>

              {paymentMethod === 'mobile_money' && (
                <div style={{ marginBottom: 8 }}>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>
                    MTN / Airtel Number
                  </label>
                  <input
                    className="plans-phone-input"
                    type="text"
                    placeholder="e.g. 077XXXXXXX or 075XXXXXXX"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    required
                  />
                  <p className="plans-phone-hint">A LivePay prompt will be sent to your phone to authorize payment.</p>
                </div>
              )}

              <div className="plans-modal-actions">
                <button type="button" className="plans-modal-cancel" onClick={() => setShowPayment(false)}>
                  Cancel
                </button>
                <button type="submit" className="plans-modal-pay" disabled={loading}>
                  {loading ? 'Processing...' : <><Zap size={16} fill="#fff" /> Pay {selectedPkg.price.toLocaleString()} {selectedPkg.currency}</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
