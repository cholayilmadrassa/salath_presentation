import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Sliders, Crown, BookOpen, LayoutGrid, Eye, EyeOff } from 'lucide-react';

export default function AdminDisplayControlsTab({
  displaySettings,
  handleToggleDisplaySetting,
  saveSuccess,
  error,
}) {
  return (
    <Card className="border border-primary/20 shadow-md">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <h2 className="text-base font-extrabold text-foreground flex items-center gap-2">
              <Sliders className="w-5 h-5 text-primary" />
              <span>Home Page Section Controllers (വിഭാഗങ്ങൾ കാണിക്കുക / മറയ്ക്കുക)</span>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Toggle visibility for Leaderboard, Arabic Swalath card, and Quick Action Grid on the Home page.
            </p>
          </div>
          <Badge variant="outline" className="text-[10px] font-mono">Realtime Controls</Badge>
        </div>

        {saveSuccess && <Alert variant="success">{saveSuccess}</Alert>}
        {error && <Alert variant="destructive">{error}</Alert>}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          {/* Leaderboard Controller */}
          <div className={`p-4 rounded-2xl border transition-all space-y-3 ${displaySettings.showLeaderboard ? 'bg-primary/10 border-primary/30' : 'bg-muted/30 border-border opacity-70'}`}>
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-primary/20 text-primary flex items-center justify-center font-bold text-xs">
                <Crown className="w-5 h-5 text-[#D4AF37]" />
              </div>
              <Button
                type="button"
                size="sm"
                variant={displaySettings.showLeaderboard ? 'default' : 'outline'}
                onClick={() => handleToggleDisplaySetting('showLeaderboard')}
                className="rounded-xl h-8 text-xs font-bold gap-1.5"
              >
                {displaySettings.showLeaderboard ? <><Eye className="w-3.5 h-3.5" /> Visible</> : <><EyeOff className="w-3.5 h-3.5" /> Hidden</>}
              </Button>
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-foreground">Leaderboard Section</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Today's Top Leaders ranking list on Home page.</p>
            </div>
          </div>

          {/* Arabic Swalath Card Controller */}
          <div className={`p-4 rounded-2xl border transition-all space-y-3 ${displaySettings.showSwalath ? 'bg-primary/10 border-primary/30' : 'bg-muted/30 border-border opacity-70'}`}>
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-primary/20 text-primary flex items-center justify-center font-bold text-xs">
                <BookOpen className="w-5 h-5 text-primary" />
              </div>
              <Button
                type="button"
                size="sm"
                variant={displaySettings.showSwalath ? 'default' : 'outline'}
                onClick={() => handleToggleDisplaySetting('showSwalath')}
                className="rounded-xl h-8 text-xs font-bold gap-1.5"
              >
                {displaySettings.showSwalath ? <><Eye className="w-3.5 h-3.5" /> Visible</> : <><EyeOff className="w-3.5 h-3.5" /> Hidden</>}
              </Button>
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-foreground">Arabic Swalath Display</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Featured Arabic Swalath card on Home page.</p>
            </div>
          </div>

          {/* Quick Action Grid Controller */}
          <div className={`p-4 rounded-2xl border transition-all space-y-3 ${displaySettings.showQuickActions ? 'bg-primary/10 border-primary/30' : 'bg-muted/30 border-border opacity-70'}`}>
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-primary/20 text-primary flex items-center justify-center font-bold text-xs">
                <LayoutGrid className="w-5 h-5 text-primary" />
              </div>
              <Button
                type="button"
                size="sm"
                variant={displaySettings.showQuickActions ? 'default' : 'outline'}
                onClick={() => handleToggleDisplaySetting('showQuickActions')}
                className="rounded-xl h-8 text-xs font-bold gap-1.5"
              >
                {displaySettings.showQuickActions ? <><Eye className="w-3.5 h-3.5" /> Visible</> : <><EyeOff className="w-3.5 h-3.5" /> Hidden</>}
              </Button>
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-foreground">Quick Action Grid</h3>
              <p className="text-xs text-muted-foreground mt-0.5">4-Button navigation grid (Dashboard, Leaderboard, Counter, Membership).</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
