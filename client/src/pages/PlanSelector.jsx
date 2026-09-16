import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Zap, Smartphone, ArrowLeft, ShieldCheck, Star, Clock } from 'lucide-react';
import { api } from '../utils/api';

export default function PlanSelector() {
  const [packages, setPackages] = useState([]);
  const [selectedPkg, setSelectedPkg] = useState(null);
  const [step, setStep] = useState('plans'); // 'plans' | 'pay'
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const navigate = useNavigate();

  useEffect(() => { fetchPackages(); }, []);

  const fetchPackages = async () => {
    setFetching(true);
    try {
      const data = await api.get('/billing/packages');
      const list = Array.isArray(data) ? data : [];
      setPackages(list);
      if (list.length > 0) setSelectedPkg(list[0]);
    } catch {
      setError('Could not load subscription packages.');
    } finally {
      setFetching(false);
    }
  };

  const formatInterval = (str) => {
    if (!str) return '';
    const map = {
      '12_HOURS': '12 Hours', '24_HOURS': '24 Hours', 'DAILY': '1 Day',
      '3_DAYS': '3 Days', '7_DAYS': '7 Days', 'WEEKLY': '7 Days',
      '14_DAYS': '14 Days', '30_DAYS': '30 Days', 'MONTHLY': '30 Days',
      '3_MONTHS': '3 Months', '6_MONTHS': '6 Months', 'YEARLY': '1 Year'
    };
    return map[str.toUpperCase()] || str.replace(/_/g, ' ');
  };

  const handlePay = async (e) => {
    e.preventDefault();
    if (!phoneNumber.trim()) { setError('Enter your MTN or Airtel number'); return; }
    setError(''); setLoading(true); setSuccessMsg('');
    try {
      const res = await api.post('/billing/subscribe-package', {
        packageId: selectedPkg.id,
        paymentMethod: 'mobile_money',
        phoneNumber: phoneNumber.trim()
      });
      if (res.success && res.user) {
        const stored = JSON.parse(localStorage.getItem('netflix_user') || '{}');
        stored.plan = res.user.plan;
        stored.subscriptionStatus = res.user.subscriptionStatus;
        localStorage.setItem('netflix_user', JSON.stringify(stored));
        setSuccessMsg(`Payment successful! Check your phone to confirm.`);
        setTimeout(() => navigate('/browse'), 2000);
      }
    } catch (err) {
      setError(err.message || 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ps-page">
      {/* Header */}
      <div className="ps-header">
        <img src="/movie-zone-logo.svg" alt="MovieZone" className="ps-logo" onClick={() => navigate('/')} />
        <button className="ps-signout" onClick={() => { localStorage.removeItem('netflix_token'); localStorage.removeItem('netflix_user'); navigate('/login'); }}>
          Sign Out
        </button>
      </div>

      {step === 'plans' ? (
        <div className="ps-body">
          <div className="ps-hero-text">
            <div className="ps-badge"><Star size={13} fill="#e50914" /> PREMIUM STREAMING</div>
            <h1>Choose Your Plan</h1>
            <p>Unlimited Luganda VJ movies & series. Cancel anytime.</p>
          </div>

          {error && <div className="ps-alert ps-alert--error">{error}</div>}

          {fetching ? (
            <div className="ps-loading">Loading plans...</div>
          ) : packages.length === 0 ? (
            <div className="ps-loading">No plans available yet.</div>
          ) : (
            <>
              <div className="ps-grid">
                {packages.map((pkg) => {
                  const isSelected = selectedPkg?.id === pkg.id;
                  return (
                    <div
                      key={pkg.id}
                      className={`ps-card ${isSelected ? 'ps-card--active' : ''}`}
                      onClick={() => setSelectedPkg(pkg)}
                    >
                      {isSelected && <div className="ps-card-badge">SELECTED</div>}
                      <div className="ps-card-top">
                        <h3>{pkg.name}</h3>
                        <div className="ps-card-interval"><Clock size={12} /> {formatInterval(pkg.interval)}</div>
                      </div>
                      <div className="ps-card-price">
                        <span className="ps-price-amount">{pkg.price.toLocaleString()}</span>
                        <span className="ps-price-currency">{pkg.currency}</span>
                      </div>
                      <p className="ps-card-desc">{pkg.description || 'Full streaming access to all content.'}</p>
                      <div className="ps-card-specs">
                        <div className="ps-spec"><Check size={13} color="#46d369" /> {pkg.resolution}</div>
                        <div className="ps-spec"><Check size={13} color="#46d369" /> {pkg.screens} {pkg.screens === 1 ? 'Screen' : 'Screens'}</div>
                        {pkg.features && <div className="ps-spec"><Check size={13} color="#46d369" /> {pkg.features}</div>}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="ps-cta">
                <button
                  className="ps-proceed-btn"
                  disabled={!selectedPkg}
                  onClick={() => { setError(''); setStep('pay'); }}
                >
                  <Zap size={18} fill="#fff" />
                  Continue — {selectedPkg ? `${selectedPkg.price.toLocaleString()} ${selectedPkg.currency}` : ''}
                </button>
                <div className="ps-secure-note"><ShieldCheck size={14} color="#46d369" /> Secure payment via LivePay • Cancel anytime</div>
              </div>
            </>
          )}
        </div>
      ) : (
        /* ── PAY STEP ── */
        <div className="ps-body ps-pay-body">
          <button className="ps-back-btn" onClick={() => { setStep('plans'); setError(''); }}>
            <ArrowLeft size={18} /> Back to Plans
          </button>

          <div className="ps-pay-card">
            {/* Order summary */}
            <div className="ps-order-summary">
              <div className="ps-order-label">You're subscribing to</div>
              <div className="ps-order-name">{selectedPkg?.name}</div>
              <div className="ps-order-meta">
                <span>{formatInterval(selectedPkg?.interval)}</span>
                <span className="ps-order-price">{selectedPkg?.price.toLocaleString()} {selectedPkg?.currency}</span>
              </div>
            </div>

            <div className="ps-divider" />

            {/* Mobile money form */}
            <div className="ps-mm-header">
              <Smartphone size={20} color="#e50914" />
              <div>
                <div className="ps-mm-title">Mobile Money Payment</div>
                <div className="ps-mm-sub">MTN MoMo or Airtel Money (Uganda)</div>
              </div>
            </div>

            {error && <div className="ps-alert ps-alert--error">{error}</div>}
            {successMsg && <div className="ps-alert ps-alert--success"><Check size={16} /> {successMsg}</div>}

            <form onSubmit={handlePay}>
              <label className="ps-label">Phone Number</label>
              <div className="ps-phone-row">
                <span className="ps-phone-prefix">+256</span>
                <input
                  className="ps-phone-input"
                  type="tel"
                  placeholder="77 123 4567"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  maxLength={10}
                  required
                />
              </div>
              <p className="ps-phone-hint">A payment prompt will be sent to this number. Approve it on your phone to complete.</p>

              <button type="submit" className="ps-pay-btn" disabled={loading || !!successMsg}>
                {loading ? (
                  <span className="ps-pay-spinner">Processing...</span>
                ) : (
                  <><Zap size={18} fill="#fff" /> Pay {selectedPkg?.price.toLocaleString()} {selectedPkg?.currency}</>
                )}
              </button>
            </form>

            <div className="ps-secure-note" style={{ marginTop: '16px' }}>
              <ShieldCheck size={14} color="#46d369" /> Powered by LivePay • 256-bit encrypted
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
