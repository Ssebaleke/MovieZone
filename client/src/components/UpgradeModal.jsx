import React, { useState, useEffect } from 'react';
import { X, Check, ShieldCheck, Zap, Star, Smartphone } from 'lucide-react';
import { api } from '../utils/api';

export default function UpgradeModal({ isOpen, onClose, movie, onSubscriptionSuccess }) {
  const [packages, setPackages] = useState([]);
  const [selectedPkgId, setSelectedPkgId] = useState(null);
  const [paymentMethod] = useState('mobile_money');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchPackages();
    }
  }, [isOpen]);

  const fetchPackages = async () => {
    setFetching(true);
    setError('');
    try {
      const data = await api.get('/billing/packages');
      setPackages(data || []);
      if (data && data.length > 0) {
        setSelectedPkgId(data[0].id);
      }
    } catch (err) {
      console.error('Error fetching subscription packages:', err);
      setError('Could not load packages. Please try again.');
    } finally {
      setFetching(false);
    }
  };

  if (!isOpen) return null;

  const handlePay = async (e) => {
    e.preventDefault();
    if (!selectedPkgId) {
      setError('Please select a subscription package');
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
      const response = await api.post('/billing/subscribe-package', {
        packageId: selectedPkgId,
        paymentMethod,
        phoneNumber: phoneNumber.trim()
      });

      if (response.checkoutUrl) {
        setSuccessMsg('Redirecting to LivePay Card Payment Gateway...');
        setTimeout(() => {
          window.location.href = response.checkoutUrl;
        }, 800);
        return;
      }

      if (response.success && response.user) {
        // Update cached user in localStorage
        const storedUser = JSON.parse(localStorage.getItem('netflix_user') || '{}');
        const updatedUser = {
          ...storedUser,
          plan: response.user.plan,
          subscriptionStatus: response.user.subscriptionStatus
        };
        localStorage.setItem('netflix_user', JSON.stringify(updatedUser));

        setSuccessMsg(`Payment Successful! You are now subscribed to ${response.user.plan}.`);
        
        setTimeout(() => {
          onSubscriptionSuccess(updatedUser, movie);
          onClose();
        }, 1200);
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError(err.message || 'Payment processing failed. Please check details and try again.');
    } finally {
      setLoading(false);
    }
  };

  const selectedPkg = packages.find(p => p.id === selectedPkgId);

  return (
    <div className="modal-backdrop" style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: '20px'
    }}>
      <div className="upgrade-modal-content" style={{
        background: '#121318', border: '1px solid rgba(255, 255, 255, 0.15)',
        borderRadius: '16px', maxWidth: '640px', width: '100%',
        maxHeight: '90vh', overflowY: 'auto', color: '#fff',
        boxShadow: '0 20px 50px rgba(0,0,0,0.8)', padding: '28px',
        position: 'relative'
      }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: '18px', right: '18px',
            background: 'rgba(255,255,255,0.1)', border: 'none',
            color: '#fff', borderRadius: '50%', width: '32px', height: '32px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'all 0.2s ease'
          }}
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: 'rgba(229, 9, 20, 0.15)', border: '1px solid #e50914',
            color: '#ff4d4d', padding: '6px 14px', borderRadius: '20px',
            fontSize: '0.85rem', fontWeight: '700', marginBottom: '12px'
          }}>
            <Star size={14} fill="#ff4d4d" /> UNLOCK PREMIUM STREAMING
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: '800', margin: '0 0 8px 0' }}>
            Subscription Package Required
          </h2>
          <p style={{ color: '#aaa', fontSize: '0.9rem', margin: 0 }}>
            {movie ? `To watch "${movie.title}", please select a payment package below:` : 'Subscribe now to stream unlimited Luganda translated movies & series.'}
          </p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444',
            color: '#f87171', padding: '12px 16px', borderRadius: '8px',
            fontSize: '0.85rem', marginBottom: '20px'
          }}>
            {error}
          </div>
        )}

        {successMsg && (
          <div style={{
            background: 'rgba(34, 197, 94, 0.15)', border: '1px solid #22c55e',
            color: '#4ade80', padding: '12px 16px', borderRadius: '8px',
            fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '20px', textAlign: 'center'
          }}>
            <Check size={18} style={{ display: 'inline', marginRight: '6px' }} />
            {successMsg}
          </div>
        )}

        {fetching ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#888' }}>
            Loading available packages...
          </div>
        ) : (
          <form onSubmit={handlePay}>
            {/* Packages Grid */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
              {packages.map((pkg) => {
                const isSelected = selectedPkgId === pkg.id;
                return (
                  <div
                    key={pkg.id}
                    onClick={() => setSelectedPkgId(pkg.id)}
                    style={{
                      border: isSelected ? '2px solid #e50914' : '1px solid rgba(255,255,255,0.1)',
                      background: isSelected ? 'rgba(229, 9, 20, 0.08)' : '#1a1c23',
                      borderRadius: '12px', padding: '16px 20px', cursor: 'pointer',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '700', color: '#fff' }}>
                          {pkg.name}
                        </h4>
                        <span style={{
                          background: 'rgba(255,255,255,0.1)', color: '#ccc',
                          padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: '600'
                        }}>
                          {pkg.interval}
                        </span>
                      </div>
                      <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#aaa' }}>
                        {pkg.description || pkg.features}
                      </p>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.25rem', fontWeight: '800', color: isSelected ? '#ff4d4d' : '#fff' }}>
                        {pkg.price.toLocaleString()} <span style={{ fontSize: '0.8rem', color: '#aaa' }}>{pkg.currency}</span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#888', marginTop: '2px' }}>
                        {pkg.resolution} • {pkg.screens} {pkg.screens === 1 ? 'Screen' : 'Screens'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Payment Method — Mobile Money only */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                background: 'rgba(229,9,20,0.08)', border: '2px solid #e50914',
                borderRadius: '8px', padding: '12px 16px'
              }}>
                <Smartphone size={18} color="#ff4d4d" />
                <div>
                  <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>Mobile Money (MTN / Airtel)</div>
                  <div style={{ fontSize: '0.75rem', color: '#aaa' }}>Uganda Mobile Money payment</div>
                </div>
              </div>
            </div>

            {paymentMethod === 'mobile_money' && (
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#aaa', marginBottom: '6px' }}>
                  Enter Phone Number (e.g. 077XXXXXXX or 075XXXXXXX)
                </label>
                <input
                  type="text"
                  placeholder="0771234567"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  style={{
                    width: '100%', padding: '12px', borderRadius: '8px',
                    background: '#1a1c23', border: '1px solid rgba(255,255,255,0.15)',
                    color: '#fff', fontSize: '0.9rem', outline: 'none'
                  }}
                />
              </div>
            )}

            {/* Pay Button */}
            <button
              type="submit"
              disabled={loading || !selectedPkgId}
              style={{
                width: '100%', padding: '14px', borderRadius: '10px',
                border: 'none', background: '#e50914', color: '#fff',
                fontWeight: '700', fontSize: '1rem', cursor: loading ? 'wait' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                boxShadow: '0 4px 15px rgba(229, 9, 20, 0.4)'
              }}
            >
              {loading ? 'Processing Payment...' : (
                <>
                  <Zap size={18} fill="#fff" /> Pay {selectedPkg ? `${selectedPkg.price.toLocaleString()} ${selectedPkg.currency}` : ''} & Start Watching
                </>
              )}
            </button>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '14px', color: '#888', fontSize: '0.75rem' }}>
              <ShieldCheck size={14} color="#46d369" /> Instant activation • Cancel anytime • 256-bit encrypted
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
