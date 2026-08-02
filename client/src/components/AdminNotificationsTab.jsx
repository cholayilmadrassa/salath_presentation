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
  XCircle,
  Users,
  Building2,
  Link as LinkIcon,
  RefreshCw,
  Sparkles,
  Edit3,
} from 'lucide-react';

const PRESET_TEMPLATES = [
  {
    id: 'daily_reminder',
    name: 'ഇന്നത്തെ സ്വലാത്ത് ഓർമ്മപ്പെടുത്തൽ',
    title: 'സ്വലാത്ത് ഓർമ്മപ്പെടുത്തൽ',
    body: 'ഇന്നത്തെ സ്വലാത്ത് അപ്ഡേറ്റ് ചെയ്തോ?',
    url: '/counter',
    category: 'reminder',
    badge: 'Daily Reminder',
  },
  {
    id: 'jumuah_special',
    name: 'ജുമുഅ ദിന സ്വലാത്ത് 🕌',
    title: 'ജുമുഅ ദിന സ്വലാത്ത് 🕌',
    body: 'ഈ പവിത്രമായ വെള്ളിയാഴ്ച ദിനത്തിൽ ഹബീബിന്റെ മേൽ സ്വലാത്തുകൾ വർദ്ധിപ്പിക്കൂ.',
    url: '/counter',
    category: 'reminder',
    badge: 'Jumuah Special',
  },
  {
    id: 'evening_reminder',
    name: 'രാത്രികാല സ്വലാത്ത് ഓർമ്മപ്പെടുത്തൽ 🌙',
    title: 'രാത്രികാല സ്വലാത്ത് ഓർമ്മപ്പെടുത്തൽ 🌙',
    body: 'ഇന്നത്തെ നിങ്ങളുടെ സ്വലാത്ത് എണ്ണം കൃത്യമായി രേഖപ്പെടുത്തി എന്ന് ഉറപ്പുവരുത്തൂ.',
    url: '/counter',
    category: 'reminder',
    badge: 'Evening Reminder',
  },
  {
    id: 'campaign_info',
    name: '🏆 സ്വലാത്ത് ക്യാമ്പയിൻ വിവരങ്ങൾ',
    title: '🏆 സ്വലാത്ത് ക്യാമ്പയിൻ വിവരങ്ങൾ',
    body: 'സ്വലാത്ത് ക്യാമ്പയിന്റെ പുതിയ വിശേഷങ്ങളും വിവരങ്ങളും അറിയാൻ ഇവിടെ ക്ലിക്ക് ചെയ്യൂ.',
    url: '/dashboard',
    category: 'campaign',
    badge: 'Campaign Info',
  },
  {
    id: 'leaderboard_update',
    name: '📊 ലീഡർബോർഡ് അപ്ഡേറ്റ്',
    title: '📊 പുതിയ ലീഡർബോർഡ് അപ്ഡേറ്റ്',
    body: 'ആപ്ലിക്കേഷനിലെ ഇന്നത്തെ ഉയർന്ന റാങ്കുകൾ പരിശോധിക്കൂ!',
    url: '/dashboard',
    category: 'result',
    badge: 'Leaderboard',
  },
];

export default function AdminNotificationsTab({ token, tenant }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Message Type Selection: 'preset' | 'custom'
  const [messageType, setMessageType] = useState('preset');
  const [selectedPresetId, setSelectedPresetId] = useState('');

  // Form State
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [destinationUrl, setDestinationUrl] = useState('/dashboard');
  const [targetType, setTargetType] = useState('all');
  const [category, setCategory] = useState('admin_broadcast');
  const [sendMode, setSendMode] = useState('now'); // 'now' | 'schedule'
  const [scheduledAt, setScheduledAt] = useState('');

  // Confirmation Modal & Feedback
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
    setDestinationUrl(preset.url);
    setCategory(preset.category);
    setFeedback({ type: '', message: '' });
  };

  const handleMessageTypeChange = (type) => {
    setMessageType(type);
    setSelectedPresetId('');
    if (type === 'custom') {
      setTitle('');
      setBody('');
      setDestinationUrl('/dashboard');
      setCategory('admin_broadcast');
    }
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
      const res = await api('/admin/notifications', {
        method: 'POST',
        token,
        body: {
          title: title.trim(),
          body: body.trim(),
          url: destinationUrl,
          targetType,
          tenantId: tenant ? tenant._id : null,
          category,
          isScheduled: sendMode === 'schedule',
          scheduledAt: sendMode === 'schedule' ? scheduledAt : null,
        },
      });

      setFeedback({ type: 'success', message: res.message || 'Notification processed successfully!' });
      if (messageType === 'custom') {
        setTitle('');
        setBody('');
      }
      setScheduledAt('');
      setSendMode('now');
      loadHistory();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to dispatch notification.' });
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
      {/* 1. Create Notification Composer */}
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3 border-b border-border">
          <CardTitle className="text-base font-extrabold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                <Bell className="w-4 h-4 text-primary" />
              </div>
              <div>
                <span className="block text-foreground leading-tight">Send Web Push Notification</span>
                <span className="text-[11px] font-medium text-muted-foreground block">
                  Select a pre-defined template or write a custom message
                </span>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={loadHistory} title="Refresh">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </CardTitle>
        </CardHeader>

        <CardContent className="pt-4 space-y-5">
          {/* Mode Switcher: Pre-defined vs Custom */}
          <div className="flex items-center p-1 bg-muted/20 rounded-xl border border-border gap-1">
            <button
              type="button"
              onClick={() => handleMessageTypeChange('preset')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 ${
                messageType === 'preset'
                  ? 'bg-card text-primary shadow-sm border border-border'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Pre-defined Templates</span>
            </button>
            <button
              type="button"
              onClick={() => handleMessageTypeChange('custom')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 ${
                messageType === 'custom'
                  ? 'bg-card text-primary shadow-sm border border-border'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Custom Message</span>
            </button>
          </div>

          {/* Preset Templates Selector */}
          {messageType === 'preset' && (
            <div className="space-y-2">
              <label className="text-xs font-extrabold text-foreground block">Select Pre-defined Content:</label>
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
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-foreground truncate pr-2">{tmpl.name}</span>
                      <Badge variant="outline" className="text-[9px] font-mono shrink-0">
                        {tmpl.badge}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground line-clamp-1">{tmpl.body}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Notification Form */}
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
                placeholder="e.g. സ്വലാത്ത് ഓർമ്മപ്പെടുത്തൽ / 🏆 ക്യാമ്പയിൻ ഫലം"
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
                placeholder="Write your push notification message here..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={3}
                maxLength={240}
                required
                className="w-full px-3 py-2 rounded-xl text-xs bg-muted/10 border border-input focus:ring-1 focus:ring-primary focus:outline-none"
              />
            </div>

            {/* Target Audience & Category Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Target Audience */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">Target Audience</label>
                <select
                  value={targetType}
                  onChange={(e) => setTargetType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-muted/10 border border-input focus:ring-1 focus:ring-primary focus:outline-none"
                >
                  <option value="all">All Subscribed Users</option>
                  {tenant && <option value="tenant">Current Event/Team Members ({tenant.name})</option>}
                </select>
              </div>

              {/* Destination URL */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">Destination Route</label>
                <select
                  value={destinationUrl}
                  onChange={(e) => setDestinationUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-muted/10 border border-input focus:ring-1 focus:ring-primary focus:outline-none"
                >
                  <option value="/dashboard">Dashboard (/dashboard)</option>
                  <option value="/counter">Counter (/counter)</option>
                  <option value="/history">History (/history)</option>
                  <option value="/">Home Page (/)</option>
                </select>
              </div>

              {/* Notification Category */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-muted/10 border border-input focus:ring-1 focus:ring-primary focus:outline-none"
                >
                  <option value="admin_broadcast">Admin Announcement</option>
                  <option value="campaign">Campaign Info</option>
                  <option value="result">Result / Rewards</option>
                  <option value="reminder">Daily Reminder</option>
                </select>
              </div>
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
                    Select Date & Time for Delivery:
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

            {/* Action Buttons */}
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

      {/* 2. Notification Audit History & Scheduled Items */}
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3 border-b border-border">
          <CardTitle className="text-base font-extrabold flex items-center justify-between">
            <span className="text-foreground">Notification Audit History</span>
            <Badge variant="outline" className="text-xs font-bold">
              {history.length} Entries
            </Badge>
          </CardTitle>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 text-center text-xs text-muted-foreground font-medium">
              Loading notification logs...
            </div>
          ) : history.length === 0 ? (
            <div className="p-6 text-center text-xs text-muted-foreground font-medium">
              No notifications sent or scheduled yet.
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
                          : item.status === 'cancelled'
                          ? 'bg-muted text-muted-foreground border-border'
                          : 'bg-destructive/15 text-destructive border-destructive/30'
                      }`}
                    >
                      {item.status}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-[11px] font-medium text-muted-foreground pt-1">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-primary" />
                      <span className="capitalize">{item.targetType}</span>
                    </span>

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
                        {item.stats.failure > 0 && <span className="text-destructive">✗ {item.stats.failure} Failed</span>}
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

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="max-w-md font-sans">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-primary">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
              <span>Confirm Notification Dispatch</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground font-medium pt-1">
              Are you sure you want to {sendMode === 'schedule' ? 'schedule' : 'broadcast'} this Web Push notification?
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
              <span className="font-bold">Target:</span>{' '}
              <span className="capitalize">{targetType === 'tenant' ? tenant?.name || 'Organization' : 'All Users'}</span>
            </div>
            <div>
              <span className="font-bold">Delivery:</span>{' '}
              {sendMode === 'schedule' ? `Scheduled for ${new Date(scheduledAt).toLocaleString()}` : 'Immediate Broadcast'}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button variant="outline" onClick={() => setShowConfirmModal(false)} className="text-xs font-bold">
              Cancel
            </Button>
            <Button onClick={confirmDispatch} disabled={submitting} className="text-xs font-extrabold px-5">
              {submitting ? 'Dispatching...' : 'Yes, Confirm & Send'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
