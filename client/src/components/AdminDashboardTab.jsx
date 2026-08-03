import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AdminDashboardTab({ totalAmount = 0, topUsers = [], chartData = [] }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">Total SwalathCollected</h2>
          <p className="text-4xl font-extrabold text-primary mt-1">
            {Number(totalAmount).toLocaleString('en-IN')}
          </p>
        </CardContent>
      </Card>

      {/* Top 4 Participants */}
      <div className="space-y-3">
        <h2 className="text-base font-extrabold text-foreground flex items-center gap-2">
          <Trophy className="w-5 h-5 text-[#D4AF37]" />
          <span>Top Event Participants</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {topUsers.map((u, idx) => (
            <Card key={idx}>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-muted-foreground">Rank #{idx + 1}</span>
                  <Badge variant="success" className="text-[10px]">
                    {Number(u.total).toLocaleString('en-IN')}
                  </Badge>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/15 text-primary font-extrabold text-sm flex items-center justify-center shrink-0">
                    {u.name ? u.name.charAt(0) : '?'}
                  </div>
                  <h3 className="text-xs font-extrabold text-foreground truncate">{u.name}</h3>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Analytics Chart */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <h2 className="text-sm font-extrabold text-foreground">Swalath Submission Graph</h2>
          <div className="h-64 w-full">
            {chartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                No graph data available yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      borderColor: 'hsl(var(--border))',
                      borderRadius: '12px',
                      fontSize: '12px',
                    }}
                  />
                  <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
