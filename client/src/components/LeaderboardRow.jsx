export default function LeaderboardRow({ rank, name, value }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-primary-100 last:border-b-0">
      <div className="flex items-center gap-3">
        <span className="w-8 h-8 rounded-full bg-primary-200 flex items-center justify-center font-semibold">{rank}</span>
        <span className="font-medium">{name}</span>
      </div>
      <span className="text-primary-800 font-semibold">{value}</span>
    </div>
  );
}
