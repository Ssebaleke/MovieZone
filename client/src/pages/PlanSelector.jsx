import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, CreditCard, Lock, Smartphone, RefreshCw, Zap, ShieldCheck } from 'lucide-react';
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

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    setFetching(true);
    setError('');
    try {
      const data = await api.get('/billing/packages');
      const list = Array.isArray(data) ? data : [];
      setPackages(list);
      if (list.length > 0) {
        setSelectedPkgId(list[0].id);
      }
    } catch (err) {
      console.error('Error fetching subscription packages:', err);
      setError('Could not load subscription packages.');
    } finally {
      setFetching(false);
    }
  };

  const handleSubscribeSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPkgId) {
      setError('Please select a subscription plan');
      return;
    }

    if (paymentMethod === 'mobile_money' && !phoneNumber.trim()) {
      setError('Please enter your Mobile Money phone number (e.g. 077XXXXXXX or 075XXXXXXX)');
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
        setSuccessMsg('Redirecting to Card Payment Gateway...');
        setTimeout(() => {
          window.location.href = res.checkoutUrl;
        }, 600);
        return;
      }

      if (res.success && res.user) {
        const stored = JSON.parse(localStorage.getItem('netflix_user') || '{}');
        stored.plan = res.user.plan;
        stored.subscriptionStatus = res.user.subscriptionStatus;
        localStorage.setItem('netflix_user', JSON.stringify(stored));
        
        setSuccessMsg(`Payment Successful! You are now subscribed to ${res.user.plan}.`);
        setTimeout(() => {
          navigate('/profiles');
        }, 1000);
      }
    } catch (err) {
      console.error('Subscription error:', err);
      setError(err.message || 'Payment processing failed. Please check details.');
    } finally {
      setLoading(false);
    }
  };

  const selectedPkg = packages.find(p => p.id === selectedPkgId);

  return (
    <div style={{ background: '#0a0a0c', minHeight: '100vh', color: '#fff', fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div className="auth-header" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '20px 32px' }}>
        <div className="logo" style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>
          <img src="/movie-zone-logo.svg" alt="Movie Zone" style={{ height: '40px', width: 'auto' }} />
        </div>
        <button
          className="auth-btn"
          style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#ccc', borderRadius: '6px', padding: '8px 16px', cursor: 'pointer' }}
          onClick={() => {
            localStorage.removeItem('netflix_token');
            localStorage.removeItem('netflix_user');
            navigate('/login');
          }}
        >
          Sign Out
        </button>
      </div>

      <div className="plan-selection-container" style={{ maxWidth: '960px', margin: '40px auto', padding: '0 24px' }}>
        <div className="plan-header" style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(229,9,20,0.15)', border: '1px solid #e50914', color: '#e50914', padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '700', marginBottom: '12px' }}>
            <Zap size={14} /> STEP 2 OF 3
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: '900', margin: '0 0 10px 0' }}>Choose the subscription plan that's right for you</h1>
          <p style={{ color: '#aaa', fontSize: '1rem', margin: 0 }}>Watch all Ugandan VJs and global blockbusters. Change or cancel anytime.</p>
        </div>

        {error && (
          <div className="error-message" style={{ textAlign: 'center', marginBottom: '24px', padding: '14px', background: 'rgba(239,68,68,0.15)', border: '1px solid #ef4444', borderRadius: '8px', color: '#f87171' }}>
            {error}
          </div>
        )}

        {successMsg && (
          <div style={{ textAlign: 'center', marginBottom: '24px', padding: '14px', background: 'rgba(34,197,94,0.15)', border: '1px solid #22c55e', borderRadius: '8px', color: '#4ade80', fontWeight: 'bold' }}>
            <Check size={18} style={{ display: 'inline', marginRight: '6px' }} />
            {successMsg}
          </div>
        )}

        {fetching ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#888' }}>
            Loading Admin subscription packages...
          </div>
        ) : (
          <div>
            {/* Packages Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '36px' }}>
              {packages.map((pkg) => {
                const isSelected = selectedPkgId === pkg.id;
                return (
                  <div
                    key={pkg.id}
                    onClick={() => setSelectedPkgId(pkg.id)}
                    style={{
                      background: isSelected ? 'rgba(229, 9, 20, 0.08)' : '#121318',
                      border: isSelected ? '2px solid #e50914' : '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '14px',
                      padding: '28px 24px',
                      cursor: 'pointer',
                      position: 'relative',
                      display: 'flex',
                      flexDirection: 'column',
                      justify: 'space-between',
                      transition: 'all 0.25s ease',
                      boxShadow: isSelected ? '0 10px 30px rgba(229,9,20,0.25)' : 'none'
                    }}
                  >
                    <div>
                      {isSelected && (
                        <span style={{ position: 'absolute', top: '14px', right: '14px', background: '#e50914', color: '#fff', fontSize: '0.7rem', fontWeight: '800', padding: '3px 10px', borderRadius: '12px' }}>
                          SELECTED
                        </span>
                      )}

                      <h3 style={{ fontSize: '1.4rem', fontWeight: '800', margin: '0 0 4px 0', color: '#fff' }}>{pkg.name}</h3>
                      <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.1)', color: '#ccc', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '700', marginBottom: '16px' }}>
                        {pkg.interval} DURATION
                      </div>

                      <div style={{ fontSize: '2rem', fontWeight: '900', color: isSelected ? '#ff4d4d' : '#fff', marginBottom: '12px' }}>
                        {pkg.price.toLocaleString()} <span style={{ fontSize: '0.9rem', color: '#aaa', fontWeight: '600' }}>{pkg.currency} / {pkg.interval.toLowerCase()}</span>
                      </div>

                      <p style={{ color: '#aaa', fontSize: '0.88rem', marginBottom: '20px', lineHeight: '1.4' }}>
                        {pkg.description || 'Full streaming access plan.'}
                      </p>

                      <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem', color: '#ccc' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#888' }}>Resolution</span>
                          <strong style={{ color: '#fff' }}>{pkg.resolution}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#888' }}>Simultaneous Screens</span>
                          <strong style={{ color: '#fff' }}>{pkg.screens} {pkg.screens === 1 ? 'Screen' : 'Screens'}</strong>
                        </div>
                        {pkg.features && (
                          <div style={{ marginTop: '4px', color: '#aaa', fontSize: '0.8rem', lineHeight: '1.3' }}>
                            ✓ {pkg.features}
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      style={{
                        marginTop: '24px', width: '100%', padding: '12px', borderRadius: '8px',
                        border: isSelected ? 'none' : '1px solid rgba(255,255,255,0.2)',
                        background: isSelected ? '#e50914' : 'transparent',
                        color: '#fff', fontWeight: '700', fontSize: '0.9rem', cursor: 'pointer'
                      }}
                    >
                      {isSelected ? 'Selected' : 'Choose Plan'}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Action Bar */}
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
              <button
                className="auth-btn plan-select-btn"
                onClick={() => setShowPayment(true)}
                disabled={!selectedPkgId}
                style={{ background: '#e50914', color: '#fff', border: 'none', padding: '16px 48px', borderRadius: '8px', fontSize: '1.1rem', fontWeight: '800', cursor: 'pointer', boxShadow: '0 4px 20px rgba(229,9,20,0.4)' }}
              >
                Proceed to Checkout ({selectedPkg ? `${selectedPkg.price.toLocaleString()} ${selectedPkg.currency}` : ''}) →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Payment Modal Overlay */}
      {showPayment && selectedPkg && (
        <div className="payment-modal-overlay">
          <div className="payment-modal-card" style={{ maxWidth: '520px', background: '#161820', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '16px', padding: '32px' }}>
            <h3 style={{ margin: '0 0 6px 0', fontSize: '1.5rem', fontWeight: '800' }}>Complete Membership Billing</h3>
            <p style={{ color: '#aaa', fontSize: '0.9rem', marginBottom: '20px' }}>
              Subscribing to <strong>{selectedPkg.name}</strong> ({selectedPkg.price.toLocaleString()} {selectedPkg.currency} / {selectedPkg.interval.toLowerCase()}).
            </p>

            {error && <span className="error-message" style={{ marginBottom: '16px', display: 'block', padding: '10px', background: 'rgba(239,68,68,0.15)', border: '1px solid #ef4444', borderRadius: '6px', color: '#f87171' }}>{error}</span>}

            <form onSubmit={handleSubscribeSubmit}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#ccc', marginBottom: '8px' }}>
                  Select Payment Option
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('mobile_money')}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                      padding: '12px', borderRadius: '8px',
                      border: paymentMethod === 'mobile_money' ? '2px solid #e50914' : '1px solid rgba(255,255,255,0.1)',
                      background: paymentMethod === 'mobile_money' ? 'rgba(229,9,20,0.1)' : '#0a0a0c',
                      color: '#fff', fontWeight: '600', fontSize: '0.85rem', cursor: 'pointer'
                    }}
                  >
                    <Smartphone size={16} color="#ff4d4d" /> Mobile Money
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                      padding: '12px', borderRadius: '8px',
                      border: paymentMethod === 'card' ? '2px solid #e50914' : '1px solid rgba(255,255,255,0.1)',
                      background: paymentMethod === 'card' ? 'rgba(229,9,20,0.1)' : '#0a0a0c',
                      color: '#fff', fontWeight: '600', fontSize: '0.85rem', cursor: 'pointer'
                    }}
                  >
                    <CreditCard size={16} color="#ff4d4d" /> Credit / Debit Card
                  </button>
                </div>
              </div>

              {paymentMethod === 'mobile_money' && (
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#ccc', marginBottom: '6px' }}>
                    MTN / Airtel Mobile Money Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 077XXXXXXX or 075XXXXXXX"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    style={{ width: '100%', background: '#0a0a0c', border: '1px solid rgba(255,255,255,0.2)', padding: '14px', borderRadius: '8px', color: '#fff', fontSize: '0.95rem', outline: 'none' }}
                    required
                  />
                  <div style={{ fontSize: '0.75rem', color: '#888', marginTop: '6px' }}>
                    LivePay prompt will be sent to your phone to enter PIN and authorize.
                  </div>
                </div>
              )}

              <div className="payment-actions" style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button type="button" className="payment-cancel" onClick={() => setShowPayment(false)} style={{ flex: 1, background: '#222', color: '#ccc', border: '1px solid rgba(255,255,255,0.1)', padding: '14px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" className="payment-confirm" disabled={loading} style={{ flex: 2, background: '#e50914', color: '#fff', border: 'none', padding: '14px', borderRadius: '8px', fontWeight: '800', cursor: loading ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 15px rgba(229,9,20,0.4)' }}>
                  {loading ? 'Processing...' : (
                    <>
                      <Zap size={18} fill="#fff" /> Pay {selectedPkg.price.toLocaleString()} {selectedPkg.currency}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
