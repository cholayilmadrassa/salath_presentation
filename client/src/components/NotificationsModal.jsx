import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../api.js';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Bell,
  RefreshCw,
  BellRing,
  Trophy,
  Megaphone,
  BarChart3,
  MessageSquare,
  WifiOff,
} from 'lucide-react';

export default function NotificationsModal({ isOpen, onClose }) {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchNotifications = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api('/notifications/inbox', { token });
      setNotifications(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching notifications inbox:', err);
      setError(err.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && token) {
      fetchNotifications();
    }
  }, [isOpen, token]);

  const handleNotificationClick = (url) => {
    onClose();
    if (url) {
      navigate(url);
    }
  };

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
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md font-sans max-h-[85vh] flex flex-col p-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="p-4 border-b border-border bg-card shrink-0">
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <Bell className="w-5 h-5 text-primary" />
              </div>
              <div>
                <span className="font-extrabold text-base block text-foreground leading-tight">
                  അറിയിപ്പുകൾ (Notifications)
                </span>
                <span className="text-[11px] text-muted-foreground font-medium block">
                  നിങ്ങളുടെ ആപ്പിലെ എല്ലാ അറിയിപ്പുകളും ഇവിടെ കാണാം
                </span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={fetchNotifications}
              title="Refresh"
              className="h-8 w-8 rounded-full"
            >
              <RefreshCw className={`w-4 h-4 text-muted-foreground ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </DialogTitle>
        </DialogHeader>

        {/* Notifications Feed */}
        <div className="flex-1 overflow-y-auto">
          {loading && notifications.length === 0 ? (
            <div className="divide-y divide-border/50">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="flex items-start gap-3.5 px-4 py-4">
                  <Skeleton className="w-11 h-11 rounded-full shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <Skeleton className="h-4 w-3/5" />
                      <Skeleton className="h-3 w-12 shrink-0" />
                    </div>
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-4/5" />
                  </div>
                </div>
              ))}
            </div>
          ) : error && notifications.length === 0 ? (
            <div className="py-12 text-center space-y-3 px-4">
              <div className="w-12 h-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
                <WifiOff className="w-6 h-6" />
              </div>
              <p className="text-xs font-extrabold text-foreground">{error}</p>
              <p className="text-[11px] text-muted-foreground max-w-xs mx-auto">
                {error === 'No internet connection'
                  ? 'ഇന്റർനെറ്റ് കണക്ഷൻ പരിശോധിച്ച ശേഷം വീണ്ടും ശ്രമിക്കുക.'
                  : 'അറിയിപ്പുകൾ ലഭ്യമാക്കുന്നതിൽ തടസ്സം നേരിട്ടു.'}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchNotifications}
                className="text-xs font-bold gap-1.5 rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </Button>
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-muted/20 flex items-center justify-center mx-auto text-muted-foreground">
                <Bell className="w-6 h-6 opacity-40" />
              </div>
              <p className="text-xs font-bold text-foreground">പുതിയ അറിയിപ്പുകൾ ഒന്നുമില്ല</p>
              <p className="text-[11px] text-muted-foreground max-w-xs mx-auto">
                നിങ്ങൾക്ക് അയക്കുന്ന ഓർമ്മപ്പെടുത്തലുകളും സന്ദേശങ്ങളും ഇവിടെ കാണാം.
              </p>
            </div>
          ) : (
            notifications.map((item, index) => {
              const { icon: CategoryIcon, bgColor, iconColor } = getCategoryMeta(item.category);

              return (
                <div
                  key={item._id}
                  onClick={() => handleNotificationClick(item.url)}
                  className={`flex items-start gap-3.5 px-4 py-4 transition-colors duration-150 hover:bg-muted/30 active:bg-muted/40 cursor-pointer ${
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
                      <h4 className="font-bold text-[13px] sm:text-sm text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                        {item.title}
                      </h4>
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
      </DialogContent>
    </Dialog>
  );
}

