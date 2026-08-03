import { Crown, Star, Zap } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';

const medalEmoji = ['🥇', '🥈', '🥉'];

export default function LeaderboardSection({ leaders = [], loading = false, error = '' }) {
  return (
    <section id="leaderboard" className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-extrabold flex items-center gap-2 text-foreground">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center shadow-sm bg-primary text-primary-foreground">
            <Crown className="w-4 h-4 text-[#D4AF37]" />
          </div>
          <span>Today's Top Leaders</span>
        </h2>
      </div>

      {error && <Alert variant="destructive">{error}</Alert>}

      {loading ? (
        <div className="py-8 text-center space-y-2">
          <div className="w-8 h-8 mx-auto rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-xs font-medium text-muted-foreground">Loading...</p>
        </div>
      ) : leaders.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto bg-primary/15 text-primary">
              <Zap className="w-6 h-6" />
            </div>
            <p className="text-xs font-bold text-foreground">No entries recorded today yet</p>
            <p className="text-[11px] text-muted-foreground">Be the first to record your Swalath count today!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {leaders.map((row, idx) => (
            <div
              key={row.userId || idx}
              className={`bg-card rounded-2xl p-3.5 shadow-xs flex items-center justify-between transition active:scale-[0.98] animate-slide-up stagger-${idx + 1} border ${
                idx === 0 ? 'border-primary ring-1 ring-primary/30' : 'border-border'
              }`}
              style={{ animationFillMode: 'both' }}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center font-extrabold text-sm shrink-0 shadow-xs ${
                    idx === 0 ? 'bg-primary text-primary-foreground' : idx < 3 ? 'bg-secondary text-secondary-foreground' : 'bg-primary/15 text-primary'
                  }`}
                >
                  {idx < 3 ? medalEmoji[idx] : `#${idx + 1}`}
                </div>
                <div>
                  <h3 className="font-extrabold text-xs sm:text-sm leading-tight text-foreground">
                    {row.name}
                  </h3>
                  <div className="flex items-center gap-1 text-[10px] font-semibold mt-0.5 text-muted-foreground">
                    <Star className="w-3 h-3 text-[#D4AF37] fill-[#D4AF37]" />
                    <span>{row.place || 'Participant'}</span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span className="font-extrabold text-sm text-primary font-mono block">
                  {Number(row.value).toLocaleString('en-IN')}
                </span>
                <span className="text-[9px] uppercase font-bold text-muted-foreground">
                  Today
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
