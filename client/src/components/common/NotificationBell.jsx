import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, 
  Key, 
  Trophy, 
  CheckCheck, 
  Trash2, 
  ExternalLink, 
  Copy, 
  Check, 
  X,
  Sparkles,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

// Subtle Web Audio chime for instant push sound effect
const playChimeSound = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch (e) {
    // AudioContext might be blocked before first user gesture
  }
};

export default function NotificationBell() {
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [liveToast, setLiveToast] = useState(null);

  const prevCountRef = useRef(0);
  const dropdownRef = useRef(null);

  const fetchNotifications = async (isBackgroundPoll = false) => {
    if (!token) return;
    try {
      if (!isBackgroundPoll) setLoading(true);
      const res = await api.get('/notifications');
      const data = res.data;
      
      const newItems = data.notifications || [];
      const newUnread = data.unreadCount || 0;

      // Detect if a brand new unread notification just arrived
      if (isBackgroundPoll && newUnread > prevCountRef.current && newItems.length > 0) {
        const topItem = newItems[0];
        setLiveToast(topItem);
        playChimeSound();
        setTimeout(() => setLiveToast(null), 8000);
      }

      prevCountRef.current = newUnread;
      setNotifications(newItems);
      setUnreadCount(newUnread);
    } catch (err) {
      console.warn('[Fetch notifications failed]:', err.message);
    } finally {
      if (!isBackgroundPoll) setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications(false);
    // Real-time polling every 12 seconds
    const interval = setInterval(() => {
      fetchNotifications(true);
    }, 12000);
    return () => clearInterval(interval);
  }, [token]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopyText = (text, id, e) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleNotificationClick = (notif) => {
    if (!notif.isRead) {
      handleMarkAsRead(notif._id);
    }
    if (notif.link) {
      navigate(notif.link);
      setIsOpen(false);
    }
  };

  const formatTimeAgo = (dateStr) => {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        id="notification-bell-btn"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchNotifications(false);
        }}
        className="relative p-2 rounded-lg bg-[#141824] border border-white/10 hover:border-white/20 text-slate-300 hover:text-white transition-all focus:outline-none"
        title="In-App Push Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-[#E6002B] text-[9px] font-black text-white items-center justify-center shadow-sm">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </span>
        )}
      </button>

      {/* Floating Live Toast Alert Popup */}
      {liveToast && (
        <div className="fixed top-24 right-4 z-50 max-w-sm w-full bg-[#141824] border-2 border-emerald-500/80 rounded-xl p-4 shadow-2xl shadow-emerald-950/40 animate-bounce duration-500">
          <div className="flex items-start justify-between gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
              <Key className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                  New Alert
                </span>
                <span className="text-[10px] text-slate-400">Just now</span>
              </div>
              <h4 className="text-sm font-bold text-white mt-1">{liveToast.title}</h4>
              <p className="text-xs text-slate-300 mt-1 line-clamp-2">{liveToast.message}</p>
              
              {liveToast.metadata?.roomId && (
                <div className="mt-2.5 p-2 rounded bg-black/60 border border-white/10 flex items-center justify-between text-xs font-mono">
                  <span className="text-emerald-400">ID: {liveToast.metadata.roomId}</span>
                  <span className="text-slate-300">PASS: {liveToast.metadata.password}</span>
                  <button
                    onClick={(e) => handleCopyText(`${liveToast.metadata.roomId} | ${liveToast.metadata.password}`, 'toast', e)}
                    className="text-xs text-white hover:text-emerald-300 p-1"
                  >
                    {copiedId === 'toast' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={() => setLiveToast(null)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2.5 w-80 sm:w-96 bg-[#0E121B] border border-white/15 rounded-xl shadow-2xl z-50 overflow-hidden backdrop-blur-md">
          {/* Header */}
          <div className="p-3.5 px-4 bg-[#141824] border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-white">Notifications</span>
              {unreadCount > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#E6002B] text-white font-bold">
                  {unreadCount}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-[10px] text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 transition-colors"
              >
                <CheckCheck className="w-3 h-3" /> Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto divide-y divide-white/5">
            {loading && notifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">Loading alerts...</div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-50" />
                <p className="text-xs font-semibold text-slate-300">No notifications yet</p>
                <p className="text-[11px] text-slate-500 mt-1">
                  You will receive instant alerts when Room IDs, Qualifications, or match updates are posted.
                </p>
              </div>
            ) : (
              notifications.map((notif) => {
                const isRoom = notif.type === 'room_credentials';
                const isQual = notif.type === 'qualification';
                const isPayout = notif.type === 'payout';

                return (
                  <div
                    key={notif._id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`p-3.5 hover:bg-white/5 cursor-pointer transition-colors ${
                      !notif.isRead ? 'bg-cyan-950/20 border-l-2 border-cyan-500' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className={`mt-0.5 p-2 rounded-lg flex-shrink-0 ${
                        isRoom ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                        isQual ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                        isPayout ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                        'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      }`}>
                        {isRoom ? <Key className="w-4 h-4" /> :
                         isQual ? <Trophy className="w-4 h-4" /> :
                         isPayout ? <DollarSign className="w-4 h-4" /> :
                         <AlertCircle className="w-4 h-4" />}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h5 className="text-xs font-bold text-white truncate">{notif.title}</h5>
                          <span className="text-[10px] text-slate-400 flex-shrink-0">
                            {formatTimeAgo(notif.createdAt)}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 mt-1 leading-snug line-clamp-2">
                          {notif.message}
                        </p>

                        {/* Quick Credential Box for Room ID alerts */}
                        {isRoom && notif.metadata?.roomId && (
                          <div className="mt-2 p-2 rounded-lg bg-black/60 border border-amber-500/30 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-3 font-mono text-[11px]">
                              <div>
                                <span className="text-slate-400 block text-[9px]">ROOM ID</span>
                                <span className="font-bold text-amber-300">{notif.metadata.roomId}</span>
                              </div>
                              <div className="h-4 w-px bg-white/20"></div>
                              <div>
                                <span className="text-slate-400 block text-[9px]">PASSWORD</span>
                                <span className="font-bold text-white">{notif.metadata.password}</span>
                              </div>
                            </div>
                            <button
                              onClick={(e) => handleCopyText(`Room ID: ${notif.metadata.roomId} | Password: ${notif.metadata.password}`, notif._id, e)}
                              className="px-2 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[10px] font-bold flex items-center gap-1 transition-colors"
                            >
                              {copiedId === notif._id ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-400" /> Copied
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" /> Copy
                                </>
                              )}
                            </button>
                          </div>
                        )}

                        {/* Tournament Tag & Mark Read */}
                        <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                          {notif.tournament ? (
                            <span className="truncate max-w-[150px] text-slate-400">
                              🏆 {notif.tournament.title}
                            </span>
                          ) : <span />}
                          {!notif.isRead && (
                            <button
                              onClick={(e) => handleMarkAsRead(notif._id, e)}
                              className="text-cyan-400 hover:text-cyan-300 font-semibold"
                            >
                              Mark read
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 bg-[#141824] border-t border-white/10 text-center">
            <span className="text-[10px] text-slate-400">
              ⚡ Real-time alerts for Room IDs, Matches & Leaderboards
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
