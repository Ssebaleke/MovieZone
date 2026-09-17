import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Zap, ShieldCheck, Star, Clock, X, Smartphone, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { api } from '../utils/api';
import { usePaymentPoller } from '../utils/usePaymentPoller';

export default function PlanSelector() {
  const [packages, setPackages]       = useState([]);
  const [fetching, setFetching]       = useState(true);
  const [fetchError, setFetchError]   = useState('');
  const [overlay, setOverlay]         = useState(null); // null | 'phone' | 'waiting' | 'success' | 'failed'
  const [selectedPkg, setSelectedPkg] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneError, setPhoneError]   = useState('');
  const [failMsg, setFailMsg]         = useState('');
  const [reference, setReference]     = useState('');

  const navigate = useNavigate();
  const { startPolling, stopPolling } = usePaymentPoller();

  useEffect(() => {
    api.get('/billing/packages')
      .then(d => setPackages(Array.isArray(d) ? d : []))
      .catch(() => setFetchError('Could not load packages.'))
      .finally(() => setFetching(false));
    return () => stopPolling();
  }, []);

  const formatInterval = (str) => {
    if (!str) return '';
    const map = {
      '12_HOURS':'12 Hours','24_HOURS':'24 Hours','1_DAYS':'1 Day','3_DAYS':'3 Days',
      '7_DAYS':'7 Days','14_DAYS':'14 Days','30_DAYS':'30 Days','3_MONTHS':'3 Months',
      '6_MONTHS':'6 Months','1_YEARS':'1 Year','DAILY':'1 Day','WEEKLY':'7 Days',
      'MONTHLY':'30 Days','YEARLY':'1 Year'
    };
    return map[str.toUpperCase()] || str.replace(/_/g, ' ');
  };

  const handleSelectPkg = (pkg) => {
    setSelectedPkg(pkg); setPhoneNumber(''); setPhoneError(''); setOverlay('phone');
  };

  const handlePay = async (e) => {
    e.preventDefault();
    const phone = phoneNumber.trim();
    if (!phone) { setPhoneError('Enter your MTN or Airtel number'); return; }
    setPhoneError('');
    setOverlay('waiting');
    try {
      const res = await api.post('/billing/subscribe-package', {
        packageId: selectedPkg.id,
        paymentMethod: 'mobile_money',
        phoneNumber: phone
      });
      if (!res.success) {
        setFailMsg(res.message || 'Payment request failed. Please try again.');
        setOverlay('failed');
        return;
      }
      if (res.status === 'SUCCESS' && res.user) {
        const stored = JSON.parse(localStorage.getItem('netflix_user') || '{}');
        stored.plan = res.user.plan;
        stored.subscriptionStatus = res.user.subscriptionStatus;
        localStorage.setItem('netflix_user', JSON.stringify(stored));
        setOverlay('success');
        setTimeout(() => navigate('/browse'), 2500);
        return;
      }
      const ref = res.reference;
      setReference(ref);
      startPolling(ref,
        () => { setOverlay('success'); setTimeout(() => navigate('/browse'), 2500); },
        (msg) => { setFailMsg(msg); setOverlay('failed'); }
      );
    } catch (err) {
      setFailMsg(err.message || 'Payment failed. Please try again.');
      setOverlay('failed');
    }
  };

  const handleCancel = () => { stopPolling(); setOverlay(null); setReference(''); };

  return (
    <div className="ps-page">
      <div className="ps-header">
        <img src="/movie-zone-logo.svg" alt="MovieZone" className="ps-logo" onClick={() => navigate('/')} />
        <button className="ps-signout" onClick={() => { localStorage.removeItem('netflix_token'); localStorage.removeItem('netflix_user'); navigate('/login'); }}>
          Sign Out
        </button>
      </div>

      <div className="ps-body">
        <div className="ps-hero-text">
          <div className="ps-badge"><Star size={13} fill="#e50914" /> PREMIUM STREAMING</div>
          <h1>Choose Your Plan</h1>
          <p>Unlimited Luganda VJ movies &amp; series. Tap a plan to subscribe.</p>
        </div>

        {fetchError && <div className="ps-alert ps-alert--error">{fetchError}</div>}

        {fetching ? (
          <div className="ps-loading">Loading plans...</div>
        ) : packages.length === 0 ? (
          <div className="ps-loading">No plans available yet.</div>
        ) : (
          <div className="ps-grid">
            {packages.map((pkg) => (
              <div key={pkg.id} className="ps-card" onClick={() => handleSelectPkg(pkg)}>
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
                <button className="ps-select-btn"><Zap size={14} fill="#fff" /> Subscribe</button>
              </div>
            ))}
          </div>
        )}

        <div className="ps-secure-note" style={{ marginTop: '24px' }}>
          <ShieldCheck size={14} color="#46d369" /> Secure payment via LivePay • Cancel anytime
        </div>
      </div>

      {overlay && (
        <div className="ps-overlay" onClick={() => { if (overlay === 'phone' || overlay === 'failed') handleCancel(); }}>
          <div className="ps-overlay-sheet" onClick={e => e.stopPropagation()}>

            {overlay === 'phone' && (
              <>
                <button className="ps-overlay-close" onClick={handleCancel}><X size={18} /></button>
                <div className="ps-ov-icon"><Smartphone size={28} color="#e50914" /></div>
                <h3 className="ps-ov-title">Enter Phone Number</h3>
                <p className="ps-ov-sub">
                  Pay <strong>{selectedPkg?.price.toLocaleString()} {selectedPkg?.currency}</strong> for <strong>{selectedPkg?.name}</strong>
                </p>
                <form onSubmit={handlePay} className="ps-ov-form">
                  <div className="ps-phone-row">
                    <span className="ps-phone-prefix">+256</span>
                    <input className="ps-phone-input" type="tel" placeholder="77 123 4567"
                      value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} maxLength={10} autoFocus />
                  </div>
                  {phoneError && <p className="ps-ov-error">{phoneError}</p>}
                  <p className="ps-phone-hint">A payment prompt will be sent to this number. Approve it with your PIN.</p>
                  <button type="submit" className="ps-pay-btn"><Zap size={16} fill="#fff" /> Pay Now</button>
                </form>
              </>
            )}

            {overlay === 'waiting' && (
              <div className="ps-ov-center">
                <div className="ps-ov-pulse-wrap">
                  <div className="ps-ov-pulse-ring" />
                  <Loader2 size={32} color="#e50914" className="ps-spin ps-ov-pulse-icon" />
                </div>
                <h3 className="ps-ov-title">Waiting for Payment</h3>
                <p className="ps-ov-sub">
                  A prompt has been sent to <strong>{phoneNumber}</strong>.<br />
                  Enter your PIN on your phone to confirm.
                </p>
                {reference && <p className="ps-ov-ref">Ref: {reference}</p>}
                <button className="ps-ghost-btn" style={{ marginTop: '24px' }} onClick={handleCancel}>Cancel</button>
              </div>
            )}

            {overlay === 'success' && (
              <div className="ps-ov-center">
                <div className="ps-ov-result-icon ps-ov-result-icon--success">
                  <CheckCircle2 size={40} color="#46d369" />
                </div>
                <h3 className="ps-ov-title" style={{ color: '#46d369' }}>Payment Confirmed!</h3>
                <p className="ps-ov-sub">Your <strong>{selectedPkg?.name}</strong> subscription is now active.</p>
                <p className="ps-ov-hint">Redirecting you to browse…</p>
              </div>
            )}

            {overlay === 'failed' && (
              <div className="ps-ov-center">
                <div className="ps-ov-result-icon ps-ov-result-icon--failed">
                  <XCircle size={40} color="#e50914" />
                </div>
                <h3 className="ps-ov-title" style={{ color: '#e50914' }}>Payment Failed</h3>
                <p className="ps-ov-sub">{failMsg}</p>
                <div style={{ display: 'flex', gap: '10px', marginTop: '24px', width: '100%' }}>
                  <button className="ps-ghost-btn" onClick={handleCancel}>Cancel</button>
                  <button className="ps-pay-btn" style={{ flex: 1 }} onClick={() => setOverlay('phone')}>Try Again</button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
