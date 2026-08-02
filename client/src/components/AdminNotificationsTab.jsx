import { useState, useEffect } from 'react';
import { api } from '../api.js';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Bell,
  Send,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Users,
  RefreshCw,
} from 'lucide-react';

const PRESET_TEMPLATES = [
  {
    id: 'daily_reminder',
    name: 'സ്വലാത്ത് ഓർമ്മപ്പെടുത്തൽ',
    title: 'സ്വലാത്ത് ഓർമ്മപ്പെടുത്തൽ 🕌',
    body: 'ഇന്നത്തെ സ്വലാത്ത് അപ്ഡേറ്റ് ചെയ്തോ? എണ്ണം വേഗം രേഖപ്പെടുത്തൂ.',
  },
  {
    id: 'jumuah_special',
    name: 'ജുമുഅ ദിന ഓർമ്മപ്പെടുത്തൽ',
    title: 'ജുമുഅ ദിന പ്രത്യേക സ്വലാത്ത് 🕌',
    body: 'ഈ പവിത്രമായ വെള്ളിയാഴ്ച ദിനത്തിൽ ഹബീബിന്റെ മേൽ സ്വലാത്തുകൾ വർദ്ധിപ്പിക്കൂ.',
  },
  {
    id: 'evening_reminder',
    name: 'രാത്രികാല ഓർമ്മപ്പെടുത്തൽ',
    title: 'രാത്രികാല സ്വലാത്ത് ഓർമ്മപ്പെടുത്തൽ 🌙',
    body: 'ഇന്നത്തെ നിങ്ങളുടെ സ്വലാത്ത് എണ്ണം കൃത്യമായി രേഖപ്പെടുത്തി എന്ന് ഉറപ്പുവരുത്തൂ.',
  },
  {
    id: 'campaign_info',
    name: 'ക്യാമ്പയിൻ വാർത്തകൾ',
    title: '🏆 സ്വലാത്ത് ക്യാമ്പയിൻ വിവരങ്ങൾ',
    body: 'സ്വലാത്ത് ക്യാമ്പയിന്റെ പുതിയ വിശേഷങ്ങളും വിവരങ്ങളും അറിയാൻ ആപ്പ് തുറക്കൂ.',
  },
];

export default function AdminNotificationsTab({ token, tenant }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [selectedPresetId, setSelectedPresetId] = useState('');

  // Notification Fields
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [sendMode, setSendMode] = useState('now'); // 'now' | 'schedule'
  const [scheduledAt, setScheduledAt] = useState('');

  // Confirmation Dialog & Feedback
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const loadHistory = async () => {
    setLoading(true);
    try {
      const data = await api('/admin/notifications', { token });
      setHistory(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load notification history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) loadHistory();
  }, [token]);

  // Select Preset Template
  const applyPresetTemplate = (preset) => {
    setSelectedPresetId(preset.id);
    setTitle(preset.title);
    setBody(preset.body);
    setFeedback({ type: '', message: '' });
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    setFeedback({ type: '', message: '' });

    if (!title.trim() || !body.trim()) {
      setFeedback({ type: 'error', message: 'Notification title and message body are required.' });
      return;
    }

    if (sendMode === 'schedule') {
      if (!scheduledAt) {
        setFeedback({ type: 'error', message: 'Please select a valid future date and time for scheduled send.' });
        return;
      }
      const sDate = new Date(scheduledAt);
      if (sDate <= new Date()) {
        setFeedback({ type: 'error', message: 'Scheduled date/time must be in the future.' });
        return;
      }
    }

    setShowConfirmModal(true);
  };

  const confirmDispatch = async () => {
    setShowConfirmModal(false);
    setSubmitting(true);
    setFeedback({ type: '', message: '' });

    try {
      const formattedScheduledAt = sendMode === 'schedule' && scheduledAt ? new Date(scheduledAt).toISOString() : null;

      const res = await api('/admin/notifications', {
        method: 'POST',
        token,
        body: {
          title: title.trim(),
          body: body.trim(),
          url: '/',
          targetType: tenant ? 'tenant' : 'all',
          tenantId: tenant ? tenant._id : null,
          category: 'admin_broadcast',
          isScheduled: sendMode === 'schedule',
          scheduledAt: formattedScheduledAt,
        },
      });

      setFeedback({ type: 'success', message: res.message || 'Notification sent successfully!' });
      setTitle('');
      setBody('');
      setSelectedPresetId('');
      setScheduledAt('');
      setSendMode('now');
      loadHistory();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to send notification.' });
    } finally {
      setSubmitting(false);
    }
  };

  const cancelScheduledNotification = async (id) => {
    try {
      await api(`/admin/notifications/${id}/cancel`, {
        method: 'POST',
        token,
      });
      loadHistory();
    } catch (err) {
      alert(err.message || 'Could not cancel scheduled notification');
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Notification Composer */}
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3 border-b border-border">
          <CardTitle className="text-base font-extrabold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                <Bell className="w-4 h-4 text-primary" />
              </div>
              <div>
                <span className="block text-foreground leading-tight">Send Notification to Members</span>
                <span className="text-[11px] font-medium text-muted-foreground block">
                  {tenant ? `Broadcast notification to members of ${tenant.name}` : 'Broadcast notification to all members'}
                </span>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={loadHistory} title="Refresh History">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </CardTitle>
        </CardHeader>

        <CardContent className="pt-4 space-y-5">
          {/* Quick Templates Selector */}
          <div className="space-y-2">
            <label className="text-xs font-extrabold text-foreground block">Select Quick Template:</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {PRESET_TEMPLATES.map((tmpl) => (
                  <button
                    key={tmpl.id}
                    type="button"
                    onClick={() => applyPresetTemplate(tmpl)}
                    className={`text-left p-3 rounded-xl border transition-all text-xs space-y-1 relative ${
                      selectedPresetId === tmpl.id
                        ? 'border-primary bg-primary/10 shadow-sm'
                        : 'border-border bg-card hover:bg-muted/10'
                    }`}
                  >
                    <span className="font-extrabold text-foreground block truncate">{tmpl.name}</span>
                    <p className="text-[11px] text-muted-foreground line-clamp-1">{tmpl.body}</p>
                  </button>
                ))}
              </div>
            </div>

          {/* Form */}
          <form onSubmit={handleFormSubmit} className="space-y-4 pt-1">
            {feedback.message && (
              <div
                className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                  feedback.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-destructive/10 text-destructive border border-destructive/20'
                }`}
              >
                {feedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                ) : (
                  <AlertTriangle className="w-4 h-4 shrink-0 text-destructive" />
                )}
                <span>{feedback.message}</span>
              </div>
            )}

            {/* Notification Title */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-foreground">Notification Title *</label>
              <input
                type="text"
                placeholder="e.g. സ്വലാത്ത് ഓർമ്മപ്പെടുത്തൽ"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={80}
                required
                className="w-full px-3 py-2 rounded-xl text-xs bg-muted/10 border border-input focus:ring-1 focus:ring-primary focus:outline-none"
              />
            </div>

            {/* Notification Body */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-foreground">Message Body *</label>
              <textarea
                placeholder="Write message to send to your organization members..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={3}
                maxLength={240}
                required
                className="w-full px-3 py-2 rounded-xl text-xs bg-muted/10 border border-input focus:ring-1 focus:ring-primary focus:outline-none"
              />
            </div>

            {/* Audience Badge Indicator */}
            <div className="p-3 bg-muted/15 border border-border rounded-xl flex items-center justify-between text-xs text-foreground font-medium">
              <span className="flex items-center gap-1.5 font-bold">
                <Users className="w-4 h-4 text-primary" />
                <span>Recipients:</span>
              </span>
              <Badge variant="outline" className="text-xs font-bold">
                {tenant ? `${tenant.name} Members` : 'All Subscribed Members'}
              </Badge>
            </div>

            {/* Send Mode: Send Now vs Schedule */}
            <div className="space-y-2 pt-2 border-t border-border">
              <label className="text-xs font-bold text-foreground block">Delivery Mode</label>
              <div className="flex items-center gap-4 text-xs font-bold">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="sendMode"
                    value="now"
                    checked={sendMode === 'now'}
                    onChange={() => setSendMode('now')}
                    className="text-primary focus:ring-primary"
                  />
                  <span>Send Immediately</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="sendMode"
                    value="schedule"
                    checked={sendMode === 'schedule'}
                    onChange={() => setSendMode('schedule')}
                    className="text-primary focus:ring-primary"
                  />
                  <span>Schedule for Later</span>
                </label>
              </div>

              {sendMode === 'schedule' && (
                <div className="pt-2">
                  <label className="text-[11px] font-bold text-muted-foreground block mb-1">
                    Select Date & Time:
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    required={sendMode === 'schedule'}
                    className="px-3 py-2 rounded-xl text-xs bg-muted/10 border border-input focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>
              )}
            </div>

            {/* Send Button */}
            <div className="pt-2 flex justify-end">
              <Button type="submit" disabled={submitting} className="text-xs font-extrabold px-6">
                {sendMode === 'schedule' ? (
                  <>
                    <Calendar className="w-4 h-4 mr-1.5" />
                    <span>Schedule Notification</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-1.5" />
                    <span>Send Notification Now</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* History Feed */}
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3 border-b border-border">
          <CardTitle className="text-base font-extrabold flex items-center justify-between">
            <span className="text-foreground">Sent Notification History</span>
            <Badge variant="outline" className="text-xs font-bold">
              {history.length} Sent
            </Badge>
          </CardTitle>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 text-center text-xs text-muted-foreground font-medium">
              Loading notification history...
            </div>
          ) : history.length === 0 ? (
            <div className="p-6 text-center text-xs text-muted-foreground font-medium">
              No notifications sent yet.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {history.map((item) => (
                <div key={item._id} className="p-3.5 sm:p-4 space-y-2 hover:bg-muted/10 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-extrabold text-sm text-foreground leading-tight">{item.title}</h4>
                      <p className="text-xs text-muted-foreground font-medium mt-0.5 line-clamp-2">{item.body}</p>
                    </div>

                    <Badge
                      className={`shrink-0 text-[10px] font-extrabold capitalize ${
                        item.status === 'sent'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : item.status === 'scheduled'
                          ? 'bg-amber-100 text-amber-800 border-amber-300'
                          : 'bg-destructive/15 text-destructive border-destructive/30'
                      }`}
                    >
                      {item.status}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-[11px] font-medium text-muted-foreground pt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-primary" />
                      <span>
                        {item.status === 'scheduled' && item.scheduledAt
                          ? `Scheduled: ${new Date(item.scheduledAt).toLocaleString()}`
                          : item.sentAt
                          ? `Sent: ${new Date(item.sentAt).toLocaleString()}`
                          : `Created: ${new Date(item.createdAt).toLocaleString()}`}
                      </span>
                    </span>

                    {item.stats && (
                      <span className="flex items-center gap-1.5 font-bold text-foreground">
                        <span className="text-emerald-600">✓ {item.stats.success || 0} Delivered</span>
                      </span>
                    )}

                    {item.status === 'scheduled' && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => cancelScheduledNotification(item._id)}
                        className="ml-auto h-6 text-[10px] font-bold px-2"
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Modal */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="max-w-md font-sans">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-primary">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
              <span>Confirm Notification Send</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground font-medium pt-1">
              Are you sure you want to send this notification to your members?
            </DialogDescription>
          </DialogHeader>

          <div className="bg-muted/15 border border-border p-3.5 rounded-xl space-y-1.5 text-xs text-foreground font-medium">
            <div>
              <span className="font-bold">Title:</span> {title}
            </div>
            <div>
              <span className="font-bold">Message:</span> {body}
            </div>
            <div>
              <span className="font-bold">Recipients:</span>{' '}
              {tenant ? `${tenant.name} Members` : 'All Subscribed Members'}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button variant="outline" onClick={() => setShowConfirmModal(false)} className="text-xs font-bold">
              Cancel
            </Button>
            <Button onClick={confirmDispatch} disabled={submitting} className="text-xs font-extrabold px-5">
              {submitting ? 'Sending...' : 'Yes, Confirm & Send'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
