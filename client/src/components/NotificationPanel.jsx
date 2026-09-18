import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, CheckCheck, Info, Zap, AlertTriangle, Gift } from 'lucide-react';
import { api } from '../utils/api';

const TYPE_ICON = {
  SUCCESS: <Zap size={14} color="#46d369" />,
  WARNING: <AlertTriangle size={14} color="#f5a623" />,
  PROMO:   <Gift size={14} color="#e50914" />,
  INFO:    <Info size={14} color="#4a9eff" />
};

const timeAgo = (date) => {
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

export default function NotificationPanel() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef(null);
  const isLoggedIn = !!localStorage.getItem('netflix_token');

  const fetchNotifications = async () => {
    if (!isLoggedIn) return;
    try {
      setLoading(true);
      const data = await api.get('/notifications');
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // poll every 60s
    return () => clearInterval(interval);
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleOpen = () => {
    setOpen(p => !p);
    if (!open) fetchNotifications();
  };

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications(p => p.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {}
  };

  const markRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(p => p.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(p => Math.max(0, p - 1));
    } catch {}
  };

  if (!isLoggedIn) return null;

  return (
    <div className="notif-wrap" ref={panelRef}>
      <button className="notif-bell-btn" onClick={handleOpen} aria-label="Notifications">
        <Bell size={20} color="#fff" />
        {unreadCount > 0 && (
          <span className="notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      {open && (
        <div className="notif-panel">
          <div className="notif-panel-header">
            <span className="notif-panel-title">Notifications</span>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {unreadCount > 0 && (
                <button className="notif-mark-all-btn" onClick={markAllRead} title="Mark all as read">
                  <CheckCheck size={15} /> Mark all read
                </button>
              )}
              <button className="notif-close-btn" onClick={() => setOpen(false)}><X size={16} /></button>
            </div>
          </div>

          <div className="notif-list">
            {loading && notifications.length === 0 ? (
              <div className="notif-empty">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="notif-empty">
                <Bell size={28} color="#444" />
                <span>No notifications yet</span>
              </div>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  className={`notif-item${n.isRead ? '' : ' notif-item--unread'}`}
                  onClick={() => !n.isRead && markRead(n.id)}
                >
                  <div className="notif-item-icon">{TYPE_ICON[n.type] || TYPE_ICON.INFO}</div>
                  <div className="notif-item-body">
                    <div className="notif-item-title">{n.title}</div>
                    <div className="notif-item-msg">{n.message}</div>
                    <div className="notif-item-time">{timeAgo(n.createdAt)}</div>
                  </div>
                  {!n.isRead && <div className="notif-unread-dot" />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
