import { Link } from 'react-router-dom';
import { BookOpen, Crown, Heart, Users } from 'lucide-react';

export default function QuickActionGrid({ user }) {
  const quickActions = [
    { icon: <BookOpen className="w-5 h-5" />, label: 'Dashboard', to: user ? '/dashboard' : '/login' },
    { icon: <Crown className="w-5 h-5" />, label: 'Leaderboard', to: '/dashboard' },
    { icon: <Heart className="w-5 h-5" />, label: 'Counter', to: user ? '/counter' : '/signup' },
    { icon: <Users className="w-5 h-5" />, label: 'Membership', to: '/signup' },
  ];

  return (
    <section className="px-4 pt-4 pb-2 max-w-xl mx-auto w-full">
      <div className="grid grid-cols-4 gap-3">
        {quickActions.map((item, i) => (
          <Link
            key={i}
            to={item.to}
            className={`flex flex-col items-center gap-2 py-3.5 rounded-2xl bg-card shadow-xs active:scale-95 transition border border-border animate-slide-up stagger-${i + 1}`}
            style={{ animationFillMode: 'both' }}
          >
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm bg-primary/15 text-primary">
              {item.icon}
            </div>
            <span className="text-[10px] font-extrabold leading-tight text-center text-foreground">
              {item.label}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
