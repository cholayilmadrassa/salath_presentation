import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../api.js';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Bell,
  ArrowLeft,
  RefreshCw,
  BellRing,
  Trophy,
  Megaphone,
  BarChart3,
  MessageSquare,
} from 'lucide-react';

export default function NotificationsPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await api('/notifications/inbox', { token });
      if (res && res.notifications) {
        setNotifications(res.notifications);
        if (res.unreadCount > 0) {
          markAllAsReadSilently();
        }
      } else {
        setNotifications(Array.isArray(res) ? res : []);
      }
    } catch (err) {
      console.error('Error fetching notifications inbox:', err);
    } finally {
      setLoading(false);
    }
  };

  const markAllAsReadSilently = async () => {
    if (!token) return;
    try {
      await api('/notifications/mark-read', {
        method: 'POST',
        token,
        body: { markAll: true },
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (e) {}
  };

  useEffect(() => {
    fetchNotifications();

    // Mark all as read automatically on unmount / when leaving the page
    return () => {
      if (token) {
        api('/notifications/mark-read', {
          method: 'POST',
          token,
          body: { markAll: true },
        }).catch(() => {});
      }
    };
  }, [token]);

  const formatTimeAgo = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'ഇപ്പോൾ';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
    });
  };

  const getCategoryMeta = (category) => {
    switch (category) {
      case 'reminder':
        return {
          icon: BellRing,
          bgColor: 'bg-amber-50',
          iconColor: 'text-amber-500',
        };
      case 'milestone':
        return {
          icon: Trophy,
          bgColor: 'bg-emerald-50',
          iconColor: 'text-emerald-500',
        };
      case 'campaign':
        return {
          icon: Megaphone,
          bgColor: 'bg-blue-50',
          iconColor: 'text-blue-500',
        };
      case 'result':
        return {
          icon: BarChart3,
          bgColor: 'bg-purple-50',
          iconColor: 'text-purple-500',
        };
      default:
        return {
          icon: MessageSquare,
          bgColor: 'bg-primary/10',
          iconColor: 'text-primary',
        };
    }
  };

  return (
    <main className="max-w-xl mx-auto px-3.5 safe-top pb-10 pt-3 sm:py-6 font-sans space-y-4">
      {/* Page Header Bar */}
      <div className="flex items-center justify-between gap-3 pb-2 border-b border-border">
        <div className="flex items-center gap-2.5">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-full shrink-0 hover:bg-muted/20 active:scale-95"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </Button>

          <div>
            <h1 className="font-extrabold text-lg leading-tight text-foreground flex items-center gap-2">
              <span>അറിയിപ്പുകൾ</span>
              <Badge variant="muted" className="font-mono text-[10px] py-0 px-1.5 h-4 font-bold">
                {notifications.length}
              </Badge>
            </h1>
            <p className="text-[11px] text-muted-foreground font-medium">
              Notifications & Announcements
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={fetchNotifications}
          disabled={loading}
          className="w-8.5 h-8.5 rounded-full shrink-0 shadow-2xs hover:border-primary/40 active:scale-95"
          title="Refresh Feed"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-muted-foreground ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Notifications Feed */}
      <div className="bg-card rounded-2xl border border-border/60 overflow-hidden shadow-sm">
        {loading && notifications.length === 0 ? (
          <div className="py-16 text-center text-xs font-medium text-muted-foreground space-y-2.5">
            <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p>അറിയിപ്പുകൾ ലോഡ് ചെയ്യുന്നു...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-14 text-center space-y-2.5 px-4">
            <div className="w-12 h-12 rounded-full bg-muted/20 flex items-center justify-center mx-auto text-muted-foreground">
              <Bell className="w-6 h-6 opacity-40" />
            </div>
            <h3 className="text-sm font-extrabold text-foreground">പുതിയ അറിയിപ്പുകൾ ഒന്നുമില്ല</h3>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto font-medium">
              നിങ്ങൾക്ക് അയക്കുന്ന പുതിയ അറിയിപ്പുകളും ഓർമ്മപ്പെടുത്തലുകളും ഇവിടെ കാണാം.
            </p>
          </div>
        ) : (
          notifications.map((item, index) => {
            const { icon: CategoryIcon, bgColor, iconColor } = getCategoryMeta(item.category);

            return (
              <div
                key={item._id}
                className={`flex items-start gap-3.5 px-4 py-4 transition-colors duration-150 hover:bg-muted/30 active:bg-muted/40 ${
                  index < notifications.length - 1 ? 'border-b border-border/50' : ''
                } ${!item.isRead ? 'bg-primary/[0.03]' : ''}`}
              >
                {/* Circular Icon */}
                <div className={`w-11 h-11 rounded-full ${bgColor} flex items-center justify-center shrink-0 mt-0.5 shadow-sm`}>
                  <CategoryIcon className={`w-5 h-5 ${iconColor}`} />
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  {/* Title Row with Time */}
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="font-bold text-[13px] sm:text-sm text-foreground leading-snug line-clamp-2">
                      {item.title}
                    </h2>
                    <span className="text-[11px] text-muted-foreground/70 font-medium shrink-0 mt-0.5">
                      {formatTimeAgo(item.sentAt || item.createdAt)}
                    </span>
                  </div>

                  {/* Body */}
                  <p className="text-xs text-muted-foreground font-normal leading-relaxed mt-1 line-clamp-2">
                    {item.body}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </main>
  );
}
