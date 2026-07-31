export default function LeaderboardRow({ rank, name, value }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border last:border-b-0">
      <div className="flex items-center gap-3">
        <span className="w-8 h-8 rounded-full bg-primary/15 text-secondary flex items-center justify-center font-semibold text-xs">{rank}</span>
        <span className="font-medium text-foreground text-sm">{name}</span>
      </div>
      <span className="text-primary font-semibold">{value}</span>
    </div>
  );
}
