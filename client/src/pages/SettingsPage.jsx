import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { LogOut, MapPin, Phone, ShieldCheck, LogIn, UserPlus, Download, Share, Bell, AlertCircle, Users, Plus, ChevronRight, ArrowLeftRight, X, Settings as SettingsIcon, Pencil, Clock, CheckCircle2, HelpCircle } from 'lucide-react';
import { api } from '../api.js';
import {
  subscribeUserToPush,
  unsubscribeUserFromPush,
  getPushSubscriptionState,
} from '../utils/pushManager.js';
import {
  isPrayerNotifEnabled,
  enablePrayerNotifications,
  disablePrayerNotifications,
  sendTestPrayerNotification,
  getPrayerCityName,
} from '../utils/prayerTimeNotifier.js';

export default function SettingsPage() {
  const { user, token, login, logout } = useAuth();
  const navigate = useNavigate();
  const isAdmin = sessionStorage.getItem('isAdmin') === '1' || user?.role === 'tenant_admin' || user?.role === 'super_admin';
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showGuide, setShowGuide] = useState(false);

  const [pushState, setPushState] = useState({ isSubscribed: false, isIOS: false, isStandalone: true });
  const [pushLoading, setPushLoading] = useState(false);
  const [pushError, setPushError] = useState('');

  // Prayer time notification state
  const [prayerEnabled, setPrayerEnabled] = useState(false);
  const [prayerLoading, setPrayerLoading] = useState(false);
  const [prayerError, setPrayerError] = useState('');
  const [testAlertLoading, setTestAlertLoading] = useState(false);
  const [testAlertSuccess, setTestAlertSuccess] = useState('');
  const [showNotifPermissionModal, setShowNotifPermissionModal] = useState(false);
  const [showNotifGuide, setShowNotifGuide] = useState(false);
  const [notifModalError, setNotifModalError] = useState('');

  // Multi-account state
  const [allowMultipleAccounts, setAllowMultipleAccounts] = useState(false);
  const [myAccounts, setMyAccounts] = useState([]);
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [showSwitchAccount, setShowSwitchAccount] = useState(false);
  const [addAccountForm, setAddAccountForm] = useState({ name: '', address: '' });
  const [addAccountLoading, setAddAccountLoading] = useState(false);
  const [addAccountError, setAddAccountError] = useState('');
  const [addAccountSuccess, setAddAccountSuccess] = useState('');
  const [switchLoading, setSwitchLoading] = useState(false);
  const [switchError, setSwitchError] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);

  // Edit Account state
  const [editingAccount, setEditingAccount] = useState(null);
  const [editAccountForm, setEditAccountForm] = useState({ name: '', address: '' });
  const [editAccountLoading, setEditAccountLoading] = useState(false);
  const [editAccountError, setEditAccountError] = useState('');
  const [editAccountSuccess, setEditAccountSuccess] = useState('');

  const handleOpenEditAccount = (acc) => {
    const target = acc || { id: user?.id, name: user?.name, address: user?.address || user?.place || '' };
    setEditingAccount(target);
    setEditAccountForm({
      name: target.name || '',
      address: target.address || '',
    });
    setEditAccountError('');
    setEditAccountSuccess('');
  };

  const handleUpdateAccount = async (e) => {
    e.preventDefault();
    if (!editAccountForm.name.trim()) {
      setEditAccountError('Account name cannot be empty');
      return;
    }
    setEditAccountLoading(true);
    setEditAccountError('');
    setEditAccountSuccess('');
    try {
      const targetId = editingAccount.id || editingAccount._id || user?.id;
      const res = await api(`/auth/update-account/${targetId}`, {
        method: 'PUT',
        token,
        body: {
          name: editAccountForm.name.trim(),
          address: editAccountForm.address.trim(),
        },
      });

      setEditAccountSuccess(`Account name updated to "${res.account.name}"!`);

      // Refresh myAccounts list
      const freshAccounts = await api('/auth/my-accounts', { token });
      setMyAccounts(freshAccounts.accounts || []);

      // If active account was updated, update AuthContext
      if (res.token && res.account && (res.account.id === user?.id || targetId === user?.id)) {
        login(res.token, res.account);
      }

      setTimeout(() => {
        setEditingAccount(null);
        setEditAccountSuccess('');
      }, 1200);
    } catch (err) {
      setEditAccountError(err.message || 'Failed to update account details');
    } finally {
      setEditAccountLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      getPushSubscriptionState(token).then((res) => {
        setPushState(res);
      });
      // Load my accounts and feature flag
      api('/auth/my-accounts', { token }).then((res) => {
        setMyAccounts(res.accounts || []);
        setAllowMultipleAccounts(res.allowMultipleAccounts || false);
      }).catch(() => { });
      // Fetch inbox for notification unread count badge
      api('/notifications/inbox', { token })
        .then((res) => {
          if (res && typeof res.unreadCount === 'number') {
            setUnreadCount(res.unreadCount);
          }
        })
        .catch(() => { });
    }
    // Load prayer notification preference
    setPrayerEnabled(isPrayerNotifEnabled());
  }, [token]);

  const togglePrayerNotifications = async () => {
    setPrayerError('');
    if (prayerEnabled) {
      await disablePrayerNotifications(token);
      setPrayerEnabled(false);
      return;
    }

    // If notifications are not yet allowed in browser, show permission modal
    if (typeof Notification !== 'undefined' && Notification.permission !== 'granted') {
      setShowNotifPermissionModal(true);
      return;
    }

    setPrayerLoading(true);
    try {
      await enablePrayerNotifications(token);
      setPrayerEnabled(true);
    } catch (err) {
      setPrayerError(err.message || 'Failed to set up prayer time notifications.');
    } finally {
      setPrayerLoading(false);
    }
  };

  const handleAllowNotificationFromModal = async () => {
    setPrayerLoading(true);
    setNotifModalError('');
    try {
      if (typeof Notification === 'undefined') {
        throw new Error('Notifications are not supported on this browser/device.');
      }
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') {
        setNotifModalError('Notification permission was not granted. Please allow notifications in browser settings.');
        return;
      }
      await enablePrayerNotifications(token);
      setPrayerEnabled(true);
      setShowNotifPermissionModal(false);
      setShowNotifGuide(false);
    } catch (err) {
      setNotifModalError(err.message || 'Failed to enable notifications.');
    } finally {
      setPrayerLoading(false);
    }
  };

  const handleSendTestPrayerAlert = async () => {
    setTestAlertLoading(true);
    setTestAlertSuccess('');
    setPrayerError('');
    try {
      const shown = await sendTestPrayerNotification('Asr', '15:37');
      if (shown) {
        setTestAlertSuccess('Test prayer alert sent! Check your notification bar.');
        setTimeout(() => setTestAlertSuccess(''), 4000);
      } else {
        setPrayerError('Could not display notification. Please check browser permission.');
      }
    } catch (err) {
      setPrayerError(err.message || 'Failed to send test alert');
    } finally {
      setTestAlertLoading(false);
    }
  };

  const togglePushSubscription = async () => {
    setPushLoading(true);
    setPushError('');
    try {
      if (pushState.isSubscribed) {
        await unsubscribeUserFromPush(token);
        setPushState((prev) => ({ ...prev, isSubscribed: false }));
      } else {
        await subscribeUserToPush(token);
        const res = await getPushSubscriptionState(token);
        setPushState(res);
      }
    } catch (err) {
      if (err.message === 'IOS_PWA_REQUIRED') {
        setShowGuide(true);
      } else {
        setPushError(err.message || 'Push subscription failed.');
      }
    } finally {
      setPushLoading(false);
    }
  };

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleInstallApp = async () => {
    const promptObj = deferredPrompt || window.deferredInstallPrompt;
    if (promptObj) {
      try {
        await promptObj.prompt();
        const { outcome } = await promptObj.userChoice;
        if (outcome === 'accepted') {
          setDeferredPrompt(null);
          window.deferredInstallPrompt = null;
        }
      } catch (err) {
        setShowGuide(true);
      }
    } else {
      setShowGuide(true);
    }
  };

  const handleAddAccount = async (e) => {
    e.preventDefault();
    if (!addAccountForm.name.trim()) {
      setAddAccountError('Name is required');
      return;
    }
    setAddAccountLoading(true);
    setAddAccountError('');
    setAddAccountSuccess('');
    try {
      const data = await api('/auth/add-account', {
        method: 'POST',
        token,
        body: { name: addAccountForm.name.trim(), address: addAccountForm.address.trim() },
      });
      setAddAccountSuccess(`Account "${data.user.name}" created! Switching now...`);
      setAddAccountForm({ name: '', address: '' });
      // Refresh account list
      const res = await api('/auth/my-accounts', { token: data.token });
      setMyAccounts(res.accounts || []);
      // Auto switch to new account
      setTimeout(() => {
        login(data.token, data.user);
        setShowAddAccount(false);
        setAddAccountSuccess('');
        navigate('/');
      }, 1200);
    } catch (err) {
      setAddAccountError(err.message || 'Failed to create account');
    } finally {
      setAddAccountLoading(false);
    }
  };

  const handleSwitchAccount = async (account) => {
    if (account.isCurrentAccount || String(account.id) === String(user?.id)) return;
    setSwitchLoading(true);
    setSwitchError('');
    try {
      const data = await api('/auth/login-select', {
        method: 'POST',
        token,
        body: {
          userId: account.id,
          phone: user?.phone || account.phone,
          tenantSlug: null,
        },
      });
      login(data.token, data.user);
      setShowSwitchAccount(false);
      // Refresh accounts list with new token so current active and other accounts update immediately
      const freshAccounts = await api('/auth/my-accounts', { token: data.token });
      setMyAccounts(freshAccounts.accounts || []);
    } catch (err) {
      setSwitchError(err.message || 'Failed to switch account');
    } finally {
      setSwitchLoading(false);
    }
  };

  const otherAccounts = myAccounts.filter(acc => !acc.isCurrentAccount && String(acc.id) !== String(user?.id));
  const canAddMore = allowMultipleAccounts && myAccounts.length < 3;
  const hasMultipleAccounts = myAccounts.length > 1;

  return (
    <main className="max-w-md mx-auto px-4 safe-top pb-24 sm:py-10 font-sans">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary/15 flex items-center justify-center shrink-0">
            <SettingsIcon className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Settings</h1>
            <p className="text-xs font-normal text-muted-foreground">Profile details and app configuration</p>
          </div>
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate(user ? '/notifications' : '/login')}
          className="rounded-2xl border-primary/30 active:scale-95 transition-transform relative"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5 text-primary" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[9px] font-extrabold min-w-[16px] h-4 rounded-full flex items-center justify-center px-1 border-2 border-card shadow-sm animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </div>

      <Card className="shadow-lg border-border/80">
        <CardContent className="p-5 space-y-4">
          {/* User Profile Details */}
          {user ? (
            <div className="space-y-4">
              <div className="bg-primary/10 border border-primary/30 rounded-2xl p-4 space-y-4 shadow-sm">
                {/* Profile Header */}
                <div className="flex items-center justify-between pb-3 border-b border-primary/20">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg shadow-sm">
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-extrabold text-foreground text-sm">{user.name}</h4>
                        <Badge variant="success" className="text-[9px] py-0 px-1 font-mono">Active</Badge>
                      </div>
                      <span className="text-[10px] text-muted-foreground block font-medium">Registered Member</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenEditAccount({ id: user.id, name: user.name, address: user.address || user.place })}
                      className="h-8 text-xs font-bold gap-1 rounded-xl border-primary/30 text-primary hover:bg-primary/10"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </Button>
                  </div>
                </div>

                {/* Profile Details List */}
                <div className="grid grid-cols-2 gap-2 text-xs text-foreground font-medium">
                  {user.phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-primary" />
                      <span>{user.phone}</span>
                    </div>
                  )}
                  {(user.address || user.place) && (
                    <div className="flex items-center gap-1.5 col-span-2">
                      <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span>{user.address || user.place}</span>
                    </div>
                  )}
                  {user.mahallu && (
                    <div className="col-span-2 text-[11px] text-muted-foreground">
                      <span className="font-bold">Mahallu:</span> {user.mahallu}
                    </div>
                  )}
                  {user.district && (
                    <div className="col-span-2 text-[11px] text-muted-foreground">
                      <span className="font-bold">District:</span> {user.district}, {user.state}
                    </div>
                  )}
                </div>

                {/* ── Switch Account Button (Opens Modal) ── */}
                <div className="border-t border-primary/20 pt-3">
                  <Button
                    type="button"
                    variant="default"
                    onClick={() => { setShowSwitchAccount(true); setSwitchError(''); }}
                    className="w-full h-9 text-xs font-bold gap-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm flex items-center justify-center"
                  >
                    <ArrowLeftRight className="w-4 h-4" />
                    <span>Switch Account</span>
                    <span className="bg-primary-foreground/25 text-primary-foreground text-[10px] px-1.5 py-0.5 rounded-full font-mono font-extrabold">
                      {myAccounts.length || 1}
                    </span>
                  </Button>
                </div>
              </div>

              {/* ── Combined Notifications Card (Push + Prayer) ── */}
              <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                {/* Push Notifications row */}
                <div className="flex items-center justify-between p-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Bell className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-foreground">Push Notifications</h4>
                      <span className="text-[10px] text-muted-foreground block">
                        {pushState.isSubscribed ? 'Notifications Enabled' : 'Notifications Disabled'}
                      </span>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant={pushState.isSubscribed ? 'outline' : 'default'}
                    disabled={pushLoading}
                    onClick={togglePushSubscription}
                    className="h-8 text-xs font-bold px-3"
                  >
                    {pushLoading ? 'Saving...' : pushState.isSubscribed ? 'Disable' : 'Enable'}
                  </Button>
                </div>

                {pushState.isIOS && !pushState.isStandalone && (
                  <div className="mx-3.5 mb-2 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg p-2.5 text-[11px] font-medium space-y-1">
                    <div className="flex items-center gap-1 font-bold text-amber-800">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>iOS Setup Required</span>
                    </div>
                    <p className="leading-snug">
                      നോട്ടിഫിക്കേഷൻ ലഭിക്കാൻ ആദ്യം ഈ ആപ്പ് Home Screen-ലേക്ക് Add ചെയ്യുക (Safari Share → Add to Home Screen).
                    </p>
                  </div>
                )}

                {pushState.permission === 'denied' && (
                  <div className="mx-3.5 mb-2 bg-destructive/10 border border-destructive/30 text-destructive rounded-lg p-2.5 text-[11px] font-medium space-y-1">
                    <div className="flex items-center gap-1 font-bold">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 text-destructive" />
                      <span>Notification Permission Blocked</span>
                    </div>
                    <p className="leading-snug">
                      ഈ ഡൊമെയ്‌നിൽ ബ്രൗസർ നോട്ടിഫിക്കേഷൻ ബ്ലോക്ക് ചെയ്തിരിക്കുകയാണ്. വിലാസപ്പട്ടയിലെ Lock/Tune ഐക്കൺ ക്ലിക്ക് ചെയ്ത് Notifications എന്നത് <b>Allow</b> ആക്കുക.
                    </p>
                  </div>
                )}

                {pushError && (
                  <div className="mx-3.5 mb-2 text-[11px] text-destructive font-medium bg-destructive/10 p-2 rounded-lg">
                    {pushError}
                  </div>
                )}

                {/* Divider */}
                <div className="border-t border-border/60 mx-3.5" />

                {/* Prayer Time Reminders row */}
                <div className="p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                        <Clock className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-bold text-xs text-foreground">Prayer Time Reminders</h4>
                          {prayerEnabled && (
                            <span className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[10px] px-1.5 py-0.2 font-extrabold rounded-md">
                              Active
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-muted-foreground block">
                          {prayerEnabled
                            ? `Daily alerts for all 5 prayers · ${getPrayerCityName()}`
                            : 'Get notified at each daily prayer time'}
                        </span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant={prayerEnabled ? 'outline' : 'default'}
                      disabled={prayerLoading}
                      onClick={togglePrayerNotifications}
                      className={`h-8 text-xs font-bold px-3 ${
                        !prayerEnabled ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-0' : ''
                      }`}
                    >
                      {prayerLoading ? 'Setting up...' : prayerEnabled ? 'Disable' : 'Enable'}
                    </Button>
                  </div>

                  {prayerEnabled && (
                    <div className="pt-1 flex flex-wrap items-center justify-between gap-2 border-t border-border/40">
                      <span className="text-[10px] text-muted-foreground">
                        ⚡ Background & closed-app delivery enabled
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        disabled={testAlertLoading}
                        onClick={handleSendTestPrayerAlert}
                        className="h-6 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 px-2 rounded-md"
                      >
                        {testAlertLoading ? 'Sending test...' : '🔔 Test Prayer Alert'}
                      </Button>
                    </div>
                  )}

                  {testAlertSuccess && (
                    <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-500/10 p-2 rounded-lg">
                      {testAlertSuccess}
                    </div>
                  )}

                  {prayerError && (
                    <div className="text-[11px] text-destructive font-medium bg-destructive/10 p-2 rounded-lg">
                      {prayerError}
                    </div>
                  )}
                </div>
              </div>

              {/* Install App Button */}
              <Button
                variant="soft"
                onClick={handleInstallApp}
                className="w-full text-xs font-bold"
              >
                <Download className="w-4 h-4 mr-1.5 text-primary" />
                <span>Install App (Add to Home Screen)</span>
              </Button>

              {isAdmin && (
                <Button
                  variant="outline"
                  asChild
                  className="w-full text-xs font-bold text-amber-700 border-amber-300 bg-amber-50 hover:bg-amber-100"
                >
                  <Link to="/admin/panel">
                    <ShieldCheck className="w-4 h-4 mr-1.5 text-amber-700" />
                    <span>Admin Panel</span>
                  </Link>
                </Button>
              )}

              {/* Red Log Out Button */}
              <Button
                variant="destructive"
                onClick={handleLogout}
                className="w-full text-xs font-bold"
              >
                <LogOut className="w-4 h-4 mr-1.5" />
                <span>Log Out</span>
              </Button>
            </div>
          ) : (
            <div className="space-y-4 py-2 text-center">
              <p className="text-xs text-muted-foreground font-medium">
                Log in to submit Swalath counts and track your personal history.
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                <Button asChild className="w-full text-xs">
                  <Link to="/login">
                    <LogIn className="w-4 h-4 mr-1.5" />
                    <span>Log In</span>
                  </Link>
                </Button>
                <Button variant="soft" asChild className="w-full text-xs">
                  <Link to="/signup">
                    <UserPlus className="w-4 h-4 mr-1.5" />
                    <span>Register</span>
                  </Link>
                </Button>
              </div>

              {/* Install App Button for guests */}
              <Button
                variant="soft"
                onClick={handleInstallApp}
                className="w-full text-xs font-bold mt-2"
              >
                <Download className="w-4 h-4 mr-1.5 text-primary" />
                <span>Install App (Add to Home Screen)</span>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Switch & View Accounts Modal ── */}
      <Dialog open={showSwitchAccount} onOpenChange={(open) => !open && setShowSwitchAccount(false)}>
        <DialogContent className="max-w-sm font-sans max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2.5 text-foreground">
              <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center text-primary shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <span className="block font-bold text-sm">My Accounts</span>
                <span className="block text-[11px] font-normal text-muted-foreground">Tap an account to switch or edit</span>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 pt-1">
            {switchError && (
              <Alert variant="destructive" className="text-xs py-2">
                {switchError}
              </Alert>
            )}

            {/* List of Accounts */}
            <div className="space-y-2">
              {myAccounts.map((account) => {
                const isActive = account.isCurrentAccount || String(account.id) === String(user?.id);
                return (
                  <div
                    key={account.id}
                    onClick={() => {
                      if (!isActive && !switchLoading) {
                        handleSwitchAccount(account);
                      }
                    }}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                      isActive
                        ? 'border-primary/50 bg-primary/10 shadow-xs'
                        : 'border-border bg-card hover:border-primary/40 hover:bg-primary/5 cursor-pointer active:scale-[0.99]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {/* Avatar */}
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                          isActive
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {account.initial}
                      </div>

                      {/* Account Info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-xs text-foreground truncate">
                            {account.name}
                          </span>
                          {isActive && (
                            <Badge variant="success" className="text-[9px] py-0 px-1 font-mono">
                              Active
                            </Badge>
                          )}
                        </div>
                        {account.address && (
                          <p className="text-[10px] text-muted-foreground truncate">
                            {account.address}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Status & Edit Pencil */}
                    <div className="flex items-center gap-1 shrink-0">
                      {!isActive && (
                        <div className="text-muted-foreground flex items-center gap-1 px-1">
                          <ArrowLeftRight className="w-3.5 h-3.5 text-primary/70" />
                        </div>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowSwitchAccount(false);
                          handleOpenEditAccount(account);
                        }}
                        className="w-7 h-7 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/15 shrink-0"
                        title="Edit Account Name"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            {switchLoading && (
              <p className="text-center text-xs text-muted-foreground animate-pulse pt-1">
                Switching account...
              </p>
            )}

            {/* Add Another Account (inside modal) */}
            {canAddMore && !showAddAccount && (
              <button
                type="button"
                onClick={() => {
                  setShowAddAccount(true);
                  setAddAccountError('');
                  setAddAccountSuccess('');
                }}
                className="w-full flex items-center gap-2.5 p-2.5 rounded-xl border border-dashed border-primary/40 hover:bg-primary/5 transition-all text-left"
              >
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Plus className="w-4 h-4 text-primary" />
                </div>
                <p className="font-bold text-xs text-primary truncate">
                  + Add Another Account
                </p>
              </button>
            )}

            {/* Inline Add Account Form inside Modal */}
            {showAddAccount && (
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-foreground">New Account Details</span>
                  <button
                    type="button"
                    onClick={() => { setShowAddAccount(false); setAddAccountError(''); }}
                    className="w-6 h-6 rounded-full bg-muted/40 hover:bg-muted flex items-center justify-center"
                  >
                    <X className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                </div>

                {addAccountError && <Alert variant="destructive" className="text-xs py-2">{addAccountError}</Alert>}
                {addAccountSuccess && <Alert variant="success" className="text-xs py-2">{addAccountSuccess}</Alert>}

                <form onSubmit={handleAddAccount} className="space-y-2">
                  <div className="space-y-1">
                    <Label className="text-[11px] font-bold">Full Name *</Label>
                    <Input
                      type="text"
                      placeholder="e.g. Muhammed Faisal"
                      value={addAccountForm.name}
                      onChange={(e) => setAddAccountForm(f => ({ ...f, name: e.target.value }))}
                      className="h-8 text-xs"
                      disabled={addAccountLoading}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] font-bold">Address (optional)</Label>
                    <Input
                      type="text"
                      placeholder="House name, place..."
                      value={addAccountForm.address}
                      onChange={(e) => setAddAccountForm(f => ({ ...f, address: e.target.value }))}
                      className="h-8 text-xs"
                      disabled={addAccountLoading}
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <div className="flex-1 text-[10px] text-muted-foreground">
                      <Phone className="w-3 h-3 inline mr-1 text-primary" />
                      {user.phone}
                    </div>
                    <Button
                      type="submit"
                      size="sm"
                      disabled={addAccountLoading}
                      className="h-8 text-xs font-bold px-3"
                    >
                      {addAccountLoading ? 'Creating...' : 'Create'}
                    </Button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Custom Instruction Dialog */}
      <Dialog open={showGuide} onOpenChange={setShowGuide}>
        <DialogContent className="max-w-md font-sans">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-primary">
              <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center">
                <Share className="w-5 h-5 text-primary" />
              </div>
              <span className="text-foreground">To Add to Home Screen:</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 bg-primary/10 border border-primary/30 p-4 rounded-xl text-xs text-foreground font-medium">
            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-extrabold shrink-0 mt-0.5">1</span>
              <span>Open browser menu and tap <strong>Share</strong> or <strong>Three Dots</strong> icon.</span>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-extrabold shrink-0 mt-0.5">2</span>
              <span>Select <strong>"Add to Home Screen"</strong> or <strong>"Install App"</strong> option.</span>
            </div>
          </div>

          <Button
            onClick={() => setShowGuide(false)}
            className="w-full text-xs font-extrabold"
          >
            Got It
          </Button>
        </DialogContent>
      </Dialog>

      {/* ── Edit Account Name Modal ── */}
      <Dialog open={Boolean(editingAccount)} onOpenChange={(open) => !open && setEditingAccount(null)}>
        <DialogContent className="max-w-sm font-sans">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
                <Pencil className="w-4 h-4 text-primary" />
              </div>
              <span>Edit Account Details</span>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleUpdateAccount} className="space-y-3.5 pt-1">
            {editAccountError && <Alert variant="destructive" className="text-xs py-2">{editAccountError}</Alert>}
            {editAccountSuccess && <Alert variant="success" className="text-xs py-2">{editAccountSuccess}</Alert>}

            <div className="space-y-1">
              <Label className="text-xs font-bold">Account Name *</Label>
              <Input
                type="text"
                placeholder="e.g. Muhammed Faisal"
                value={editAccountForm.name}
                onChange={(e) => setEditAccountForm((prev) => ({ ...prev, name: e.target.value }))}
                className="text-xs"
                disabled={editAccountLoading}
                autoFocus
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold">Address / House Name (optional)</Label>
              <Input
                type="text"
                placeholder="e.g. Baitul Noor, Kozhikode"
                value={editAccountForm.address}
                onChange={(e) => setEditAccountForm((prev) => ({ ...prev, address: e.target.value }))}
                className="text-xs"
                disabled={editAccountLoading}
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditingAccount(null)}
                className="text-xs font-bold rounded-xl"
                disabled={editAccountLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={editAccountLoading}
                className="text-xs font-bold px-4 rounded-xl"
              >
                {editAccountLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── 🔔 Prayer Notification Permission Modal (Radix Dialog) ── */}
      <Dialog open={showNotifPermissionModal} onOpenChange={setShowNotifPermissionModal}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-sm max-h-[85vh] overflow-y-auto p-5 sm:p-6 text-center rounded-3xl border border-border shadow-2xl flex flex-col gap-3 font-sans">
          {/* Glowing Bell Icon */}
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center mx-auto ring-4 ring-emerald-500/10 shadow-xs mt-0.5 shrink-0">
            <Bell className="w-6 h-6" />
          </div>

          <DialogHeader className="space-y-1 text-center p-0 m-0">
            <DialogTitle className="font-extrabold text-base text-foreground text-center">
              നോട്ടിഫിക്കേഷൻ അനുവദിക്കുക
            </DialogTitle>
            <DialogDescription className="text-xs font-extrabold text-emerald-600 text-center">
              Enable Prayer Notifications
            </DialogDescription>
          </DialogHeader>

          <p className="text-xs text-muted-foreground leading-relaxed">
            കൃത്യസമയത്ത് നിസ്കാര സമയങ്ങൾ (ഫജ്ർ, ളുഹ്ർ, അസ്ർ, മഗ്‌രിബ്, ഇശാഅ്) ഓർമ്മിപ്പിക്കാൻ നോട്ടിഫിക്കേഷൻ ഓൺ ചെയ്യുക.
          </p>

          {notifModalError && (
            <div className="space-y-2 text-left w-full">
              <Alert variant="destructive" className="text-xs py-2 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-snug">{notifModalError}</span>
              </Alert>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowNotifPermissionModal(false);
                  setShowNotifGuide(true);
                }}
                className="w-full text-xs font-bold gap-1.5 h-8 border-primary/30 text-primary hover:bg-primary/10"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>How to Allow Notifications (സെറ്റിംഗ്സ് ഗൈഡ്)</span>
              </Button>
            </div>
          )}

          <div className="flex flex-col gap-2 pt-1 w-full">
            <Button
              type="button"
              disabled={prayerLoading}
              onClick={handleAllowNotificationFromModal}
              className="w-full rounded-xl text-xs font-bold gap-2 bg-emerald-600 hover:bg-emerald-700 text-white h-9.5 shadow-xs"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>{prayerLoading ? 'Enabling...' : 'Allow Notifications / ഓൺ ചെയ്യുക'}</span>
            </Button>

            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowNotifPermissionModal(false)}
              className="w-full rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground h-8"
            >
              Cancel (റദ്ദാക്കുക)
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── 🔒 Notification Settings Guide Dialog ── */}
      <Dialog open={showNotifGuide} onOpenChange={setShowNotifGuide}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-sm max-h-[85vh] overflow-y-auto p-5 space-y-3 text-foreground rounded-3xl font-sans border border-border shadow-2xl flex flex-col gap-3">
          <DialogHeader className="border-b border-border pb-2.5 text-left p-0 m-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-600 shrink-0">
                <SettingsIcon className="w-4 h-4" />
              </div>
              <div>
                <DialogTitle className="font-extrabold text-sm text-foreground">
                  Notification Permission Guide
                </DialogTitle>
                <DialogDescription className="text-[10px] text-muted-foreground">
                  How to allow Notifications in Settings
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-2 text-xs">
            <div className="flex items-start gap-2 p-2.5 rounded-xl bg-muted/40 border border-border/70">
              <span className="w-4.5 h-4.5 rounded-full bg-emerald-500/20 text-emerald-600 font-mono font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">1</span>
              <p className="text-muted-foreground leading-relaxed text-[11px]">
                ബ്രൗസറിന്റെ മുകളിലുള്ള <strong className="text-foreground">🔒 (ലോക്ക് / Tune)</strong> ഐക്കണിൽ അല്ലെങ്കിൽ ഫോൺ <strong className="text-foreground">App Info</strong> തുറക്കുക.
                <span className="block text-[10px] text-muted-foreground/80 mt-0.5">Tap lock icon or open Phone Settings → App Info.</span>
              </p>
            </div>

            <div className="flex items-start gap-2 p-2.5 rounded-xl bg-muted/40 border border-border/70">
              <span className="w-4.5 h-4.5 rounded-full bg-emerald-500/20 text-emerald-600 font-mono font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">2</span>
              <p className="text-muted-foreground leading-relaxed text-[11px]">
                <strong className="text-foreground">Notifications (അറിയിപ്പുകൾ)</strong> എന്നത് <strong className="text-emerald-600 dark:text-emerald-400">Allow (അനുവദിക്കുക)</strong> ചെയ്യുക.
                <span className="block text-[10px] text-muted-foreground/80 mt-0.5">Set Notifications to Allow.</span>
              </p>
            </div>

            <div className="flex items-start gap-2 p-2.5 rounded-xl bg-muted/40 border border-border/70">
              <span className="w-4.5 h-4.5 rounded-full bg-emerald-500/20 text-emerald-600 font-mono font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">3</span>
              <p className="text-muted-foreground leading-relaxed text-[11px]">
                ആപ്പിലേക്ക് തിരിച്ചുവന്ന് <strong className="text-foreground">Done, Try Again</strong> ക്ലിക്ക് ചെയ്യുക.
                <span className="block text-[10px] text-muted-foreground/80 mt-0.5">Reopen and click Done below.</span>
              </p>
            </div>
          </div>

          <Button
            type="button"
            onClick={() => {
              setShowNotifGuide(false);
              handleAllowNotificationFromModal();
            }}
            className="w-full rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white h-9 shrink-0 mt-1"
          >
            <CheckCircle2 className="w-4 h-4 mr-1.5" />
            Done, Try Again
          </Button>
        </DialogContent>
      </Dialog>
    </main>
  );
}

