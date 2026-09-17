import React, { useState, useEffect } from 'react';
import { MessageCircle, X, Send, ShieldCheck, Headset } from 'lucide-react';
import { api } from '../utils/api';

export default function WhatsAppSupport() {
  const [enabled, setEnabled] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [defaultMessage, setDefaultMessage] = useState('Hello! I need assistance with MovieZone.');
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    // Fetch public settings from server
    api.get('/settings/public')
      .then(data => {
        if (data) {
          if (data.SUPPORT_WHATSAPP_ENABLED !== 'false') {
            setEnabled(true);
          } else {
            setEnabled(false);
          }
          setPhoneNumber(data.SUPPORT_WHATSAPP_NUMBER || '256770000000');
          if (data.SUPPORT_WHATSAPP_MESSAGE) {
            setDefaultMessage(data.SUPPORT_WHATSAPP_MESSAGE);
          }
        }
      })
      .catch(err => {
        console.warn('Could not fetch WhatsApp support settings:', err);
        setEnabled(true);
        setPhoneNumber('256770000000');
      });
  }, []);

  // Clean phone number (digits only for wa.me format)
  const cleanedPhone = phoneNumber.replace(/\D/g, '');

  // If disabled or no phone number set, don't render widget
  if (!enabled || !cleanedPhone) {
    return null;
  }

  const waUrl = `https://wa.me/${cleanedPhone}?text=${encodeURIComponent(defaultMessage)}`;

  const handleOpenChat = () => {
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="wa-widget-container">
      {/* POPUP CARD */}
      {isOpen && (
        <div className="wa-popup-card">
          <div className="wa-popup-header">
            <div className="wa-popup-brand">
              <div className="wa-avatar-wrap">
                <div className="wa-avatar">
                  <Headset size={20} color="#fff" />
                </div>
                <span className="wa-online-dot" />
              </div>
              <div>
                <h4 className="wa-popup-title">MovieZone Support</h4>
                <p className="wa-popup-subtitle">Online · Replies instantly</p>
              </div>
            </div>
            <button className="wa-close-btn" onClick={() => setIsOpen(false)} title="Close">
              <X size={16} />
            </button>
          </div>

          <div className="wa-popup-body">
            <div className="wa-chat-bubble">
              <p>👋 Hello! Welcome to MovieZone Support.</p>
              <p style={{ marginTop: '6px' }}>Need help with subscription packages, payments, or watching movies? We are here to assist you!</p>
              <span className="wa-chat-time">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>

            <div className="wa-badge-row">
              <ShieldCheck size={14} color="#25D366" />
              <span>Official 24/7 WhatsApp Support</span>
            </div>
          </div>

          <div className="wa-popup-footer">
            <button className="wa-start-btn" onClick={handleOpenChat}>
              <Send size={16} />
              <span>Start Chat on WhatsApp</span>
            </button>
          </div>
        </div>
      )}

      {/* FLOATING ACTION BUTTON */}
      <div className="wa-fab-wrap">
        {!isOpen && isHovered && (
          <div className="wa-tooltip">
            <span>Need Help? Chat on WhatsApp</span>
          </div>
        )}

        <button
          className={`wa-fab ${isOpen ? 'wa-fab--active' : ''}`}
          onClick={() => setIsOpen(!isOpen)}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          title="WhatsApp Support"
          aria-label="WhatsApp Support"
        >
          {isOpen ? (
            <X size={26} color="#fff" />
          ) : (
            <>
              {/* WhatsApp Icon SVG */}
              <svg viewBox="0 0 32 32" className="wa-svg-icon" fill="currentColor">
                <path d="M16 2a13.9 13.9 0 0 0-12 21L2 30l7.2-1.9A13.9 13.9 0 1 0 16 2zm0 25.5a11.5 11.5 0 0 1-5.9-1.6l-.4-.2-4.4 1.1 1.2-4.3-.3-.5a11.6 11.6 0 1 1 9.8 5.5zm6.4-8.6c-.3-.2-2-.1-2.4-.2s-.6-.2-.9.2-.9 1.1-1.1 1.3-.4.3-.7.1a9.3 9.3 0 0 1-2.7-1.7 10.2 10.2 0 0 1-1.9-2.3c-.2-.3 0-.5.1-.7s.3-.4.5-.6l.3-.5c.1-.2.1-.4 0-.6s-.8-2-1.1-2.7c-.3-.7-.6-.6-.9-.6h-.7a1.4 1.4 0 0 0-1 .5 4.3 4.3 0 0 0-1.3 3.2 7.5 7.5 0 0 0 1.6 4 17.2 17.2 0 0 0 6.6 5.8c2.4 1 3.3.9 4.5.8a3.8 3.8 0 0 0 2.5-1.8 3.1 3.1 0 0 0 .2-1.8c-.1-.1-.4-.3-.7-.4z" />
              </svg>
              <span className="wa-fab-pulse" />
              <span className="wa-unread-badge">1</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
