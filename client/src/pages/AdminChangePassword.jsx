import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../api.js';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { KeyRound, ShieldAlert, CheckCircle2, Lock } from 'lucide-react';

export default function AdminChangePassword() {
  const { token, user, login } = useAuth();
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!currentPassword) {
      setError('Please enter your current or temporary password');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setError('New password must be at least 6 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const res = await api('/auth/change-password', {
        method: 'POST',
        token,
        body: { currentPassword, newPassword },
      });

      if (res && res.token && res.user) {
        setSuccessMsg('Password updated successfully! Redirecting...');
        login(res.token, res.user);
        setTimeout(() => {
          if (res.user.role === 'super_admin') {
            navigate('/super-admin');
          } else {
            navigate('/admin/panel');
          }
        }, 1200);
      } else {
        throw new Error(res?.error || 'Failed to update password');
      }
    } catch (err) {
      setError(err.message || 'Error changing password. Please verify your current temporary password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4 font-sans select-none">
      <div className="w-full max-w-md space-y-6">
        {/* Banner Alert */}
        <div className="bg-destructive/10 border border-destructive/30 rounded-2xl p-4 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
          <div className="text-xs text-destructive">
            <p className="font-extrabold text-sm tracking-tight">Action Required: Change Password</p>
            <p className="mt-1 font-semibold leading-relaxed opacity-90">
              You are logged in with a temporary password. Please set a new secure permanent password to access your Admin Dashboard.
            </p>
          </div>
        </div>

        <Card className="app-card border-primary/20 shadow-xl overflow-hidden">
          <CardHeader className="text-center pb-4 border-b border-border/40">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary mx-auto flex items-center justify-center mb-2 shadow-inner border border-primary/20">
              <KeyRound className="w-6 h-6" />
            </div>
            <CardTitle className="text-xl font-extrabold tracking-tight text-foreground">
              Set New Admin Password
            </CardTitle>
            <CardDescription className="text-xs font-semibold text-muted-foreground">
              {user?.email || user?.name}
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-6 space-y-4">
            {error && (
              <div className="bg-destructive/10 border border-destructive/30 text-destructive rounded-xl p-3 text-xs font-bold flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 rounded-xl p-3 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Current / Temporary Password</label>
                <div className="relative flex items-center">
                  <Input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter temporary password"
                    className="input !pl-11"
                    required
                  />
                  <Lock className="w-4 h-4 text-muted-foreground absolute left-3.5 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">New Permanent Password</label>
                <div className="relative flex items-center">
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="input !pl-11"
                    required
                  />
                  <KeyRound className="w-4 h-4 text-muted-foreground absolute left-3.5 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Confirm New Password</label>
                <div className="relative flex items-center">
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="input !pl-11"
                    required
                  />
                  <KeyRound className="w-4 h-4 text-muted-foreground absolute left-3.5 pointer-events-none" />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full btn-primary h-11 text-sm font-extrabold mt-2"
              >
                {loading ? 'Updating Password...' : 'Save New Password & Continue'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
