import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, Zap, Star, Smartphone, Clock, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { api } from '../utils/api';
import { usePaymentPoller } from '../utils/usePaymentPoller';

export default function UpgradeModal({ isOpen, onClose, movie, onSubscriptionSuccess }) {
  const [packages, setPackages]       = useState([]);
  const [fetching, setFetching]       = useState(true);
  const [step, setStep]               = useState('packages'); // 'packages'|'phone'|'waiting'|'success'|'failed'
  const [selectedPkg, setSelectedPkg] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneError, setPhoneError]   = useState('');
  const [failMsg, setFailMsg]         = useState('');
  const [reference, setReference]     = useState('');

  const { startPolling, stopPolling } = usePaymentPoller();

  useEffect(() => {
    if (!isOpen) return;
    setStep('packages'); setPhoneNumber(''); setPhoneError(''); setReference('');
    setFetching(true);
    api.get('/billing/packages')
      .then(d => setPackages(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setFetching(false));
    return () => stopPolling();
  }, [isOpen]);

  if (!isOpen) return null;

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
    setSelectedPkg(pkg); setPhoneNumber(''); setPhoneError(''); setStep('phone');
  };

  const handlePay = async (e) => {
    e.preventDefault();
    const phone = phoneNumber.trim();
    if (!phone) { setPhoneError('Enter your MTN or Airtel number'); return; }
    setPhoneError('');
    setStep('waiting');
    try {
      const res = await api.post('/billing/subscribe-package', {
        packageId: selectedPkg.id,
        paymentMethod: 'mobile_money',
        phoneNumber: phone
      });
      if (!res.success) {
        setFailMsg(res.message || 'Payment request failed. Please try again.');
        setStep('failed');
        return;
      }
      if (res.status === 'SUCCESS' && res.user) {
        const stored = JSON.parse(localStorage.getItem('netflix_user') || '{}');
        stored.plan = res.user.plan;
        stored.subscriptionStatus = res.user.subscriptionStatus;
        localStorage.setItem('netflix_user', JSON.stringify(stored));
        setStep('success');
        setTimeout(() => { onSubscriptionSuccess(stored, movie); onClose(); }, 2500);
        return;
      }
      const ref = res.reference;
      setReference(ref);
      startPolling(ref,
        (user) => { setStep('success'); setTimeout(() => { onSubscriptionSuccess(user, movie); onClose(); }, 2500); },
        (msg)  => { setFailMsg(msg); setStep('failed'); }
      );
    } catch (err) {
      setFailMsg(err.message || 'Payment failed. Please try again.');
      setStep('failed');
    }
  };

  const handleCancel = () => { stopPolling(); setStep('packages'); setReference(''); };

  return (
    <div className="um-backdrop" onClick={step === 'packages' ? onClose : undefined}>
      <div className="um-sheet" onClick={e => e.stopPropagation()}>

        {step === 'packages' && (
          <>
            <button className="um-close" onClick={onClose}><X size={18} /></button>
            <div className="um-header">
              <div className="um-badge"><Star size={13} fill="#e50914" /> UNLOCK PREMIUM</div>
              <h2 className="um-title">Choose a Plan</h2>
              <p className="um-sub">{movie ? `Subscribe to watch "${movie.title}"` : 'Subscribe to stream unlimited content.'}</p>
            </div>
            {fetching ? (
              <div className="um-loading">Loading packages…</div>
            ) : (
              <div className="um-pkg-list">
                {packages.map(pkg => (
                  <div key={pkg.id} className="um-pkg-row" onClick={() => handleSelectPkg(pkg)}>
                    <div className="um-pkg-info">
                      <div className="um-pkg-name">{pkg.name}</div>
                      <div className="um-pkg-meta">
                        <Clock size={11} /> {formatInterval(pkg.interval)} &nbsp;·&nbsp; {pkg.resolution} &nbsp;·&nbsp; {pkg.screens} screen{pkg.screens !== 1 ? 's' : ''}
                      </div>
                      {pkg.description && <div className="um-pkg-desc">{pkg.description}</div>}
                    </div>
                    <div className="um-pkg-price">
                      <span className="um-price-val">{pkg.price.toLocaleString()}</span>
                      <span className="um-price-cur">{pkg.currency}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="um-secure"><ShieldCheck size={13} color="#46d369" /> Secure payment via LivePay</div>
          </>
        )}

        {step === 'phone' && (
          <>
            <button className="um-close" onClick={() => setStep('packages')}><X size={18} /></button>
            <div className="um-ov-icon"><Smartphone size={32} color="#e50914" /></div>
            <h3 className="um-ov-title">Enter Phone Number</h3>
            <p className="um-ov-sub">Pay <strong>{selectedPkg?.price.toLocaleString()} {selectedPkg?.currency}</strong> · <strong>{selectedPkg?.name}</strong></p>
            <form onSubmit={handlePay} className="um-ov-form">
              <div className="ps-phone-row">
                <span className="ps-phone-prefix">+256</span>
                <input className="ps-phone-input" type="tel" placeholder="77 123 4567"
                  value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} maxLength={10} autoFocus />
              </div>
              {phoneError && <p className="um-ov-error">{phoneError}</p>}
              <p className="ps-phone-hint">A payment prompt will be sent to this number. Approve it with your PIN.</p>
              <button type="submit" className="ps-pay-btn"><Zap size={16} fill="#fff" /> Pay Now</button>
            </form>
          </>
        )}

        {step === 'waiting' && (
          <div className="um-ov-center">
            <div className="ps-ov-pulse-wrap">
              <div className="ps-ov-pulse-ring" />
              <Loader2 size={32} color="#e50914" className="ps-spin ps-ov-pulse-icon" />
            </div>
            <h3 className="um-ov-title">Waiting for Payment</h3>
            <p className="um-ov-sub">
              A prompt has been sent to <strong>{phoneNumber}</strong>.<br />
              Enter your PIN on your phone to confirm.
            </p>
            {reference && <p className="ps-ov-ref">Ref: {reference}</p>}
            <button className="ps-ghost-btn" style={{ marginTop: '24px' }} onClick={handleCancel}>Cancel</button>
          </div>
        )}

        {step === 'success' && (
          <div className="um-ov-center">
            <div className="ps-ov-result-icon ps-ov-result-icon--success">
              <CheckCircle2 size={40} color="#46d369" />
            </div>
            <h3 className="um-ov-title" style={{ color: '#46d369' }}>Payment Confirmed!</h3>
            <p className="um-ov-sub"><strong>{selectedPkg?.name}</strong> subscription is now active.</p>
            <p className="um-ov-hint">Starting your content…</p>
          </div>
        )}

        {step === 'failed' && (
          <div className="um-ov-center">
            <div className="ps-ov-result-icon ps-ov-result-icon--failed">
              <XCircle size={40} color="#e50914" />
            </div>
            <h3 className="um-ov-title" style={{ color: '#e50914' }}>Payment Failed</h3>
            <p className="um-ov-sub">{failMsg}</p>
            <div style={{ display: 'flex', gap: '10px', marginTop: '24px', width: '100%' }}>
              <button className="ps-ghost-btn" onClick={onClose}>Cancel</button>
              <button className="ps-pay-btn" style={{ flex: 1 }} onClick={() => setStep('phone')}>Try Again</button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
