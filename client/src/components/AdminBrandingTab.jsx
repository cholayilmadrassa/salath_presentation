import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch.jsx';
import { Users, Clock, CalendarClock, Ban, CheckCircle2, Play, Sparkles, AlertTriangle, Trophy } from 'lucide-react';
import { getSubmissionStatus } from '../utils/submissionStatus.js';
import StopSubmissionModal from './StopSubmissionModal.jsx';
import PublishWinnersModal from './PublishWinnersModal.jsx';

export default function AdminBrandingTab({
  brandingForm,
  setBrandingForm,
  handleUpdateBranding,
  fieldErrors = {},
  saveSuccess = '',
  error = '',
  tenant = null,
  onToggleMultipleAccounts = null,
  onToggleSubmission = null,
  onTogglePublishWinners = null,
  onToggleShowNextTopRanks = null,
}) {
  const allowMultipleAccounts = tenant?.settings?.allowMultipleAccounts === true;
  const publishWinners = tenant?.settings?.publishWinners === true;
  const showNextTopRanks = tenant?.settings?.showNextTopRanks !== false;
  const submissionStatus = getSubmissionStatus(tenant);

  const [showStopModal, setShowStopModal] = useState(false);
  const [showPublishWinnersModal, setShowPublishWinnersModal] = useState(false);

  const handleMasterToggleClick = () => {
    // If currently open or scheduled, clicking toggle initiates the stop flow (opens modal)
    if (submissionStatus.isOpen) {
      setShowStopModal(true);
    } else {
      // If currently closed, clicking toggle resumes/turns ON immediately
      if (onToggleSubmission) {
        onToggleSubmission('open', null);
      }
    }
  };

  const handleConfirmStop = async (mode, cutoffIso) => {
    if (onToggleSubmission) {
      await onToggleSubmission(mode, cutoffIso);
    }
  };

  const handlePublishWinnersSwitch = (checked) => {
    if (checked) {
      setShowPublishWinnersModal(true);
    } else {
      if (onTogglePublishWinners) {
        onTogglePublishWinners(false, false);
      }
    }
  };

  return (
    <div className="space-y-4 font-sans">
      {/* ── Event Settings Card ── */}
      <Card className="border border-border shadow-xs">
        <CardContent className="p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h2 className="text-base font-extrabold text-foreground">
                Event Settings (ക്യാമ്പയിൻ ക്രമീകരണങ്ങൾ)
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Manage participant submissions and multi-account permissions.
              </p>
            </div>
          </div>

          {/* ══════════ 1. ALLOW ADDING SWALATH TOGGLE & SCHEDULE ══════════ */}
          <div className="space-y-3 p-4 sm:p-5 rounded-2xl border border-border bg-card/60 shadow-xs">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 shadow-xs ${
                    submissionStatus.status === 'open'
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                      : submissionStatus.status === 'scheduled'
                      ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                      : 'bg-destructive/15 text-destructive'
                  }`}
                >
                  {submissionStatus.status === 'open' ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : submissionStatus.status === 'scheduled' ? (
                    <CalendarClock className="w-5 h-5 animate-pulse" />
                  ) : (
                    <Ban className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-extrabold text-foreground">
                      Allow Adding Swalath (സ്വലാത്ത് സമർപ്പണം)
                    </p>
                    {submissionStatus.status === 'open' && (
                      <Badge variant="success" className="text-[10px] font-mono font-bold">
                        OPEN
                      </Badge>
                    )}
                    {submissionStatus.status === 'scheduled' && (
                      <Badge variant="warning" className="text-[10px] font-mono font-bold">
                        SCHEDULED
                      </Badge>
                    )}
                    {submissionStatus.isClosed && (
                      <Badge variant="destructive" className="text-[10px] font-mono font-bold">
                        CLOSED
                      </Badge>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                    Default is turned ON. Turn OFF to stop immediately or schedule a cutoff date and time.
                  </p>
                </div>
              </div>

              {/* Master Toggle Switch Button */}
              <div className="shrink-0">
                <Switch
                  checked={submissionStatus.isOpen}
                  onCheckedChange={handleMasterToggleClick}
                  size="lg"
                  showLabels={true}
                  ariaLabel="Toggle allow adding swalath"
                />
              </div>
            </div>

            {/* Status Details / Schedule Panel */}
            {submissionStatus.status === 'scheduled' && (
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-2 animate-slide-down">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span>Cutoff Scheduled: {submissionStatus.formattedCutoff}</span>
                  </span>
                  <span className="text-[10px] font-mono font-bold text-amber-700 dark:text-amber-300">
                    {submissionStatus.timeRemaining.days}d {submissionStatus.timeRemaining.hours}h {submissionStatus.timeRemaining.minutes}m left
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-snug">
                  നിശ്ചയിച്ച സമയം വരെ ഉപയോക്താക്കൾക്ക് സ്വലാത്ത് രേഖപ്പെടുത്താം. ഹോം പേജിൽ ലൈവ് കൗണ്ട്ഡൗൺ പ്രദർശിപ്പിക്കുന്നുണ്ട്.
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowStopModal(true)}
                    className="text-xs h-8 rounded-xl font-bold border-amber-500/40"
                  >
                    Edit Schedule
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => onToggleSubmission && onToggleSubmission('immediately', null)}
                    className="text-xs h-8 rounded-xl font-bold"
                  >
                    Stop Immediately
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onToggleSubmission && onToggleSubmission('open', null)}
                    className="text-xs h-8 rounded-xl font-bold text-primary"
                  >
                    Remove Cutoff (Keep Open)
                  </Button>
                </div>
              </div>
            )}

            {submissionStatus.isClosed && (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/25 text-xs space-y-1.5 animate-slide-down">
                <p className="font-extrabold text-destructive flex items-center gap-1.5">
                  <Ban className="w-4 h-4" />
                  <span>
                    {submissionStatus.reason === 'cutoff_reached'
                      ? `സമയപരിധി (${submissionStatus.formattedCutoff}) പൂർത്തിയായതിനാൽ സ്വലാത്ത് സമർപ്പണം അവസാനിച്ചു.`
                      : 'സ്വലാത്ത് സമർപ്പണം അഡ്മിൻ നിർത്തിവെച്ചിരിക്കുന്നു.'}
                  </span>
                </p>
                <p className="text-[11px] text-muted-foreground">
                  ഉപയോക്താക്കൾക്ക് പുതിയ സ്വലാത്ത് രേഖപ്പെടുത്താൻ സാധിക്കില്ല. വീണ്ടും അനുവദിക്കാൻ താഴെ കാണുന്ന ബട്ടൺ ക്ലിക്ക് ചെയ്യുക.
                </p>
                <div className="pt-1">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => onToggleSubmission && onToggleSubmission('open', null)}
                    className="text-xs h-8 rounded-xl font-bold bg-primary text-primary-foreground"
                  >
                    <Play className="w-3.5 h-3.5 mr-1" />
                    <span>Re-enable Submissions (വീണ്ടും ആരംഭിക്കുക)</span>
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* ══════════ PUBLISH WINNERS TOGGLE (Only after submissions stopped) ══════════ */}
          {submissionStatus.isClosed && (
            <div className="flex flex-col p-4 sm:p-5 rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-500/10 via-card to-card shadow-xs gap-3 animate-slide-up">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center mt-0.5 shrink-0 shadow-xs">
                    <Trophy className="w-5 h-5 text-[#D4AF37]" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-extrabold text-foreground">
                        Publish Winners (വിജയികളെ പ്രഖ്യാപിക്കുക)
                      </p>
                      {publishWinners ? (
                        <Badge variant="success" className="text-[10px] font-mono font-bold">
                          PUBLISHED 🏆
                        </Badge>
                      ) : (
                        <Badge variant="muted" className="text-[10px] font-mono font-bold">
                          UNPUBLISHED
                        </Badge>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-snug">
                      ഹോം ഡാഷ്‌ബോർഡിൽ daily leaderboard-ന് പകരം കാമ്പയിനിലെ മുൻനിര വിജയികളെയും മെഡലുകളെയും ഔദ്യോഗികമായി പ്രദർശിപ്പിക്കുക.
                    </p>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-3">
                  <Switch
                    checked={publishWinners}
                    onCheckedChange={handlePublishWinnersSwitch}
                    size="lg"
                    showLabels={true}
                    ariaLabel="Toggle publish winners"
                  />
                </div>
              </div>

              {/* Sub-toggle: Show Next Top Ranks (4-10) */}
              {publishWinners && (
                <div className="pt-3 border-t border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-slide-down">
                  <div className="space-y-0.5">
                    <p className="text-xs font-extrabold text-foreground">
                      Show Next Top Ranks (മറ്റ് മുൻനിര സ്ഥാനങ്ങൾ കാണിക്കുക)
                    </p>
                    <p className="text-[11px] text-muted-foreground leading-snug">
                      4 മുതൽ 10 വരെയുള്ള സ്ഥാനക്കാരെ ഹോം പേജിൽ ടോഗിൾ ചെയ്ത് കാണാൻ ഉപയോക്താക്കളെ അനുവദിക്കുക.
                    </p>
                  </div>
                  <div className="shrink-0">
                    <Switch
                      checked={showNextTopRanks}
                      onCheckedChange={(val) => onToggleShowNextTopRanks && onToggleShowNextTopRanks(val)}
                      size="md"
                      showLabels={true}
                      ariaLabel="Toggle show next top ranks"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══════════ 2. ALLOW MULTIPLE ACCOUNTS TOGGLE ══════════ */}
          <div className="flex items-center justify-between p-4 sm:p-5 rounded-2xl border border-border bg-card/60 shadow-xs">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mt-0.5 shrink-0 shadow-xs">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-extrabold text-foreground">Allow Multiple Accounts</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                  Users can create up to 3 accounts per phone number. Login will show an account picker when multiple accounts exist.
                </p>
              </div>
            </div>
            <div className="shrink-0">
              <Switch
                checked={allowMultipleAccounts}
                onCheckedChange={(val) => onToggleMultipleAccounts && onToggleMultipleAccounts(val)}
                size="lg"
                showLabels={true}
                ariaLabel="Toggle multiple accounts"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stop Submission Modal */}
      <StopSubmissionModal
        open={showStopModal}
        onOpenChange={setShowStopModal}
        onConfirm={handleConfirmStop}
        currentCutoff={tenant?.settings?.submissionCutoff || null}
      />

      {/* Publish Winners Modal */}
      <PublishWinnersModal
        open={showPublishWinnersModal}
        onOpenChange={setShowPublishWinnersModal}
        onConfirm={async (publish) => {
          if (onTogglePublishWinners) {
            await onTogglePublishWinners(publish);
          }
        }}
      />

      {/* ── Branding Card ── */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <h2 className="text-base font-extrabold text-foreground">Event Branding</h2>
          {saveSuccess && <Alert variant="success">{saveSuccess}</Alert>}
          {error && <Alert variant="destructive">{error}</Alert>}

          <form onSubmit={handleUpdateBranding} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <Label>Event Title</Label>
              <Input
                type="text"
                value={brandingForm.title}
                onChange={(e) => setBrandingForm({ ...brandingForm, title: e.target.value })}
                className={fieldErrors.title ? 'border-destructive' : ''}
              />
              {fieldErrors.title && <p className="text-xs text-destructive">{fieldErrors.title}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Tagline / Description</Label>
              <Input
                type="text"
                value={brandingForm.tagline}
                onChange={(e) => setBrandingForm({ ...brandingForm, tagline: e.target.value })}
                className={fieldErrors.tagline ? 'border-destructive' : ''}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Primary Theme Color</Label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={brandingForm.themeColor}
                  onChange={(e) => setBrandingForm({ ...brandingForm, themeColor: e.target.value })}
                  className="w-12 h-10 rounded-xl cursor-pointer border border-input"
                />
                <Input
                  type="text"
                  value={brandingForm.themeColor}
                  onChange={(e) => setBrandingForm({ ...brandingForm, themeColor: e.target.value })}
                  className="font-mono text-xs max-w-xs"
                />
              </div>
            </div>

            <Button type="submit">Save Branding</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}


