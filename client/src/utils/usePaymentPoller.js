import { useRef, useCallback } from 'react';
import { api } from './api';

const POLL_INTERVAL = 4000;   // 4 seconds between checks
const POLL_TIMEOUT  = 180000; // 3 minutes max

/**
 * Returns a startPolling(reference, onSuccess, onFailed) function.
 * Polls /billing/transaction-status/:reference every 4s.
 * Calls onSuccess(user) or onFailed(message) when webhook has resolved it.
 * Auto-stops after 3 minutes and calls onFailed with a timeout message.
 */
export function usePaymentPoller() {
  const timerRef   = useRef(null);
  const deadlineRef = useRef(null);

  const stop = useCallback(() => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
  }, []);

  const startPolling = useCallback((reference, onSuccess, onFailed) => {
    stop();
    deadlineRef.current = Date.now() + POLL_TIMEOUT;

    const poll = async () => {
      if (Date.now() > deadlineRef.current) {
        onFailed('Payment timed out. If you approved the prompt, contact support with ref: ' + reference);
        return;
      }
      try {
        const data = await api.get(`/billing/transaction-status/${reference}`);
        const status = data?.transaction?.status;
        if (status === 'SUCCESS') {
          // Update localStorage with fresh user data
          if (data.user) {
            const stored = JSON.parse(localStorage.getItem('netflix_user') || '{}');
            stored.plan = data.user.plan;
            stored.subscriptionStatus = data.user.subscriptionStatus;
            stored.subscriptionEnd = data.user.subscriptionEnd;
            localStorage.setItem('netflix_user', JSON.stringify(stored));
          }
          onSuccess(data.user);
        } else if (status === 'FAILED') {
          onFailed(data?.transaction?.errorMessage || 'Payment was declined or cancelled.');
        } else {
          // Still PENDING — keep polling
          timerRef.current = setTimeout(poll, POLL_INTERVAL);
        }
      } catch {
        // Network hiccup — keep polling
        timerRef.current = setTimeout(poll, POLL_INTERVAL);
      }
    };

    timerRef.current = setTimeout(poll, POLL_INTERVAL);
  }, [stop]);

  return { startPolling, stopPolling: stop };
}
