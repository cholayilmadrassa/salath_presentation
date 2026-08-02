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
  Clock,
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
          iconClass: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/25',
          label: 'ഓർമ്മപ്പെടുത്തൽ',
          variant: 'warning',
        };
      case 'milestone':
        return {
          icon: Trophy,
          iconClass: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/25',
          label: 'നേട്ടം',
          variant: 'success',
        };
      case 'campaign':
        return {
          icon: Megaphone,
          iconClass: 'text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/25',
          label: 'ക്യാമ്പയിൻ',
          variant: 'default',
        };
      case 'result':
        return {
          icon: BarChart3,
          iconClass: 'text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-500/25',
          label: 'ഫലം',
          variant: 'secondary',
        };
      default:
        return {
          icon: MessageSquare,
          iconClass: 'text-primary bg-primary/10 border-primary/25',
          label: 'അറിയിപ്പ്',
          variant: 'outline',
        };
    }
  };

  return (
    <main className="max-w-xl mx-auto px-3.5 safe-top pb-24 pt-3 sm:py-6 font-sans space-y-4">
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
      <div className="space-y-3">
        {loading && notifications.length === 0 ? (
          <div className="py-16 text-center text-xs font-medium text-muted-foreground space-y-2.5">
            <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p>അറിയിപ്പുകൾ ലോഡ് ചെയ്യുന്നു...</p>
          </div>
        ) : notifications.length === 0 ? (
          <Card className="border-dashed border-border/80 shadow-none">
            <CardContent className="py-14 text-center space-y-2.5">
              <div className="w-12 h-12 rounded-2xl bg-muted/20 flex items-center justify-center mx-auto text-muted-foreground">
                <Bell className="w-6 h-6 opacity-40" />
              </div>
              <h3 className="text-sm font-extrabold text-foreground">പുതിയ അറിയിപ്പുകൾ ഒന്നുമില്ല</h3>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto font-medium">
                നിങ്ങൾക്ക് അയക്കുന്ന പുതിയ അറിയിപ്പുകളും ഓർമ്മപ്പെടുത്തലുകളും ഇവിടെ കാണാം.
              </p>
            </CardContent>
          </Card>
        ) : (
          notifications.map((item) => {
            const { icon: CategoryIcon, iconClass, label, variant } = getCategoryMeta(item.category);

            return (
              <div
                key={item._id}
                className="p-4 rounded-2xl bg-card border border-border/80 shadow-sm space-y-2.5 relative overflow-hidden transition-all duration-200 hover:border-primary/40"
              >
                {/* Top Row: Icon + Title + Time + Badge */}
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className={`w-10 h-10 rounded-2xl border shadow-2xs flex items-center justify-center shrink-0 select-none ${iconClass}`}>
                      <CategoryIcon className="w-5 h-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h2 className="font-extrabold text-xs sm:text-sm text-foreground truncate leading-tight">
                        {item.title}
                      </h2>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Clock className="w-3 h-3 text-muted-foreground/70 shrink-0" />
                        <span className="text-[10px] text-muted-foreground font-bold">
                          {formatTimeAgo(item.sentAt || item.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Badge variant={variant} className="text-[10px] font-extrabold py-0.5 px-2.5 shrink-0 shadow-2xs">
                    {label}
                  </Badge>
                </div>

                {/* Message Body */}
                <p className="text-xs text-muted-foreground font-medium leading-relaxed pl-0.5">
                  {item.body}
                </p>
              </div>
            );
          })
        )}
      </div>
    </main>
  );
}
