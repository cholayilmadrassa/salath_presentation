import React, { useState } from 'react';
import { Trophy, Crown, Sparkles, Star, Award, ChevronDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

const medalConfig = [
  {
    rank: 1,
    label: '1st Place',
    icon: '🥇',
    badge: 'Champion',
    color: 'from-[#FFD700] via-[#FDB931] to-[#C99700]',
    badgeBg: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
    itemBorder: 'border-amber-400/60 bg-gradient-to-r from-amber-500/10 via-card to-card ring-1 ring-amber-400/30',
  },
  {
    rank: 2,
    label: '2nd Place',
    icon: '🥈',
    badge: 'Runner-up',
    color: 'from-[#E0E0E0] via-[#C0C0C0] to-[#9E9E9E]',
    badgeBg: 'bg-slate-200/80 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border-slate-300/40',
    itemBorder: 'border-slate-300/60 dark:border-slate-700 bg-card',
  },
  {
    rank: 3,
    label: '3rd Place',
    icon: '🥉',
    badge: '3rd Rank',
    color: 'from-[#E69A5D] via-[#CD7F32] to-[#A05A2C]',
    badgeBg: 'bg-amber-800/15 text-amber-800 dark:text-amber-400 border-amber-700/30',
    itemBorder: 'border-amber-700/30 bg-card',
  },
];

function WinnerSkeletonRow() {
  return (
    <div className="rounded-2xl p-3.5 shadow-xs flex items-center justify-between border border-border animate-pulse bg-muted/20">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-muted shrink-0" />
        <div className="space-y-1.5">
          <div className="h-3.5 w-28 rounded bg-muted" />
          <div className="h-2.5 w-16 rounded bg-muted/70" />
        </div>
      </div>
      <div className="space-y-1 items-end flex flex-col">
        <div className="h-4 w-16 rounded bg-muted" />
        <div className="h-2 w-10 rounded bg-muted/70" />
      </div>
    </div>
  );
}

export default function WinnersCelebrationSection({
  winners = [],
  loading = false,
  error = '',
  allowNextTopRanks = true,
}) {
  const [showNextRanks, setShowNextRanks] = useState(false);
  const topThree = winners.slice(0, 3);
  const otherWinners = winners.slice(3);

  return (
    <section id="winners" className="space-y-3 animate-slide-up">
      {/* ── UNIFIED SINGLE WINNERS CARD ── */}
      <Card className="rounded-[28px] overflow-hidden border border-amber-500/35 shadow-xl bg-card">
        {/* Card Header: Celebration Banner */}
        <div className="relative overflow-hidden p-5 sm:p-6 bg-gradient-to-br from-[#1E4D2B] via-[#2F773B] to-[#4B9B47] text-white">
          {/* Ambient Glows */}
          <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full blur-3xl pointer-events-none bg-[#FFD700]/30 animate-pulse-glow" />
          <div className="absolute -bottom-10 -left-10 w-36 h-36 rounded-full blur-2xl pointer-events-none bg-emerald-300/20" />

          <div className="relative z-10 flex items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-1.5 bg-black/25 backdrop-blur-md px-3 py-1 rounded-xl border border-white/15 text-[11px] font-extrabold text-[#FFF7C2]">
              <Sparkles className="w-3.5 h-3.5 text-[#FFD700]" />
              <span>ഔദ്യോഗിക ഫലം</span>
            </div>

            <Badge className="bg-[#FFD700] text-amber-950 font-extrabold text-[10px] uppercase font-mono px-2 py-0.5 border-0 shadow-xs">
              Winners 🏆
            </Badge>
          </div>

          <div className="relative z-10 text-center space-y-1 pt-1">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-black/20 backdrop-blur-md border border-white/20 shadow-md mb-1">
              <Crown className="w-7 h-7 text-[#FFD700] drop-shadow-sm" />
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center justify-center gap-2">
              <span>കാമ്പയിൻ വിജയികൾ</span>
              <span className="text-[#FFD700]">🏆</span>
            </h2>
            <p className="text-xs font-medium text-emerald-100 max-w-sm mx-auto leading-relaxed">
              മാഷാ അല്ലാഹ്! സ്വലാത്ത് കാമ്പയിനിലെ മുൻനിര വിജയികൾ.
            </p>
            <p className="text-xs font-arabic font-bold text-[#FFF7C2] pt-0.5" dir="rtl">
              🌸 بَارَكَ اللهُ لَكُمْ وَتَقَبَّلَ اللهُ مِنَّا وَمِنْكُم 🌸
            </p>
          </div>
        </div>

        {/* Card Content: Winners List Inside the Same Card */}
        <CardContent className="p-4 sm:p-5 space-y-3">
          {error && <Alert variant="destructive" className="text-xs py-2.5">{error}</Alert>}

          {loading ? (
            <div className="space-y-2.5 py-1">
              {[...Array(3)].map((_, i) => (
                <WinnerSkeletonRow key={i} />
              ))}
            </div>
          ) : winners.length === 0 ? (
            <div className="py-8 text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto bg-primary/10 text-primary">
                <Award className="w-6 h-6" />
              </div>
              <p className="text-xs font-extrabold text-foreground">വിജയികളുടെ വിവരങ്ങൾ ലഭ്യമായിട്ടില്ല</p>
              <p className="text-[11px] text-muted-foreground">
                Winners list will appear here once finalized.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {/* Top 3 Champions Rows */}
              {topThree.map((winner, idx) => {
                const config = medalConfig[idx] || medalConfig[0];
                return (
                  <div
                    key={winner.userId || idx}
                    className={`rounded-2xl p-3.5 shadow-xs flex items-center justify-between border transition active:scale-[0.99] ${config.itemBorder}`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Medal Icon Badge */}
                      <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0 shadow-xs bg-muted/40 border border-border/80">
                        {config.icon}
                      </div>

                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-extrabold text-xs sm:text-sm leading-tight text-foreground">
                            {winner.name}
                          </h3>
                          <span
                            className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md border font-mono uppercase ${config.badgeBg}`}
                          >
                            {config.badge}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground">
                          <Star className="w-3 h-3 text-[#D4AF37] fill-[#D4AF37] shrink-0" />
                          <span className="truncate">{winner.place || 'പങ്കാളി'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0 pl-2">
                      <span className="font-extrabold text-sm sm:text-base text-primary font-mono block leading-tight">
                        {Number(winner.value).toLocaleString('en-IN')}
                      </span>
                      <span className="text-[9px] uppercase font-bold text-muted-foreground">
                        ആകെ സ്വലാത്ത്
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Ranks 4+ Toggle inside the same card */}
              {allowNextTopRanks && otherWinners.length > 0 && (
                <div className="pt-2 border-t border-border/60 space-y-2.5">
                  <div className="flex justify-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowNextRanks((prev) => !prev)}
                      className="rounded-xl text-xs font-extrabold text-muted-foreground hover:text-foreground h-8 gap-1.5 hover:bg-muted/50 cursor-pointer"
                    >
                      <Trophy className="w-3.5 h-3.5 text-[#D4AF37]" />
                      <span>
                        {showNextRanks
                          ? 'മറ്റ് സ്ഥാനങ്ങൾ മറക്കുക (Hide Next Ranks)'
                          : `മറ്റ് മുൻനിര സ്ഥാനങ്ങൾ കാണുക (${otherWinners.length} Ranks)`}
                      </span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform duration-200 ${
                          showNextRanks ? 'rotate-180' : ''
                        }`}
                      />
                    </Button>
                  </div>

                  {showNextRanks && (
                    <div className="space-y-2 animate-slide-down pt-1">
                      {otherWinners.map((winner, idx) => {
                        const rankNum = idx + 4;
                        return (
                          <div
                            key={winner.userId || rankNum}
                            className="bg-muted/30 rounded-xl p-3 shadow-xs flex items-center justify-between border border-border/60"
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-xl flex items-center justify-center font-extrabold text-xs shrink-0 shadow-xs bg-muted text-muted-foreground font-mono">
                                #{rankNum}
                              </div>
                              <div>
                                <h4 className="font-extrabold text-xs text-foreground leading-tight">
                                  {winner.name}
                                </h4>
                                <div className="text-[10px] text-muted-foreground">
                                  {winner.place || 'പങ്കാളി'}
                                </div>
                              </div>
                            </div>

                            <div className="text-right">
                              <span className="font-extrabold text-xs sm:text-sm text-primary font-mono block">
                                {Number(winner.value).toLocaleString('en-IN')}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
