import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../api.js';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Bell, Clock, ArrowRight, RefreshCw, Sparkles, CheckCircle2, Moon } from 'lucide-react';

export default function NotificationsModal({ isOpen, onClose }) {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await api('/notifications/inbox', { token });
      setNotifications(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching notifications inbox:', err);
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
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading && notifications.length === 0 ? (
            <div className="py-12 text-center text-xs font-medium text-muted-foreground space-y-2">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <span>അറിയിപ്പുകൾ ലോഡ് ചെയ്യുന്നു...</span>
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
            notifications.map((item) => (
              <div
                key={item._id}
                onClick={() => handleNotificationClick(item.url)}
                className="p-3.5 rounded-2xl bg-card border border-border/80 shadow-sm hover:border-primary/40 hover:shadow transition-all cursor-pointer space-y-2 group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                    <h4 className="font-extrabold text-xs sm:text-sm text-foreground leading-tight group-hover:text-primary transition-colors">
                      {item.title}
                    </h4>
                  </div>

                  <Badge variant="outline" className="text-[9px] font-bold shrink-0 capitalize">
                    {item.category === 'reminder'
                      ? 'ഓർമ്മപ്പെടുത്തൽ'
                      : item.category === 'milestone'
                      ? 'നേട്ടം 🎉'
                      : item.category === 'campaign'
                      ? 'ക്യാമ്പയിൻ'
                      : item.category === 'result'
                      ? 'ഫലം'
                      : 'അറിയിപ്പ്'}
                  </Badge>
                </div>

                <p className="text-xs text-muted-foreground font-medium leading-relaxed pl-4">
                  {item.body}
                </p>

                <div className="flex items-center justify-between pl-4 pt-1 text-[10px] text-muted-foreground font-semibold border-t border-border/40">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-primary/70" />
                    <span>{new Date(item.sentAt || item.createdAt).toLocaleDateString()}</span>
                  </span>

                  <span className="flex items-center gap-0.5 text-primary font-bold group-hover:translate-x-0.5 transition-transform">
                    <span>തുറക്കുക</span>
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
