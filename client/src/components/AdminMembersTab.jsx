import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, ArrowUpDown } from 'lucide-react';

export default function AdminMembersTab({
  searchQuery,
  setSearchQuery,
  sortBy,
  setSortBy,
  filteredUsers = [],
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            type="text"
            placeholder="Search member by name, phone, place..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <ArrowUpDown className="w-4 h-4 text-primary shrink-0" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-xs font-extrabold px-3 py-2 rounded-xl border border-input bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring w-full sm:w-auto"
          >
            <option value="count_desc">Sort: Count (High to Low)</option>
            <option value="count_asc">Sort: Count (Low to High)</option>
            <option value="name_asc">Sort: Name (A to Z)</option>
            <option value="name_desc">Sort: Name (Z to A)</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        {filteredUsers.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-xs font-medium text-muted-foreground">
              No members match your search criteria.
            </CardContent>
          </Card>
        ) : (
          filteredUsers.map((u) => (
            <Card key={u._id} className="hover:border-primary">
              <CardContent className="p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                    {u.name?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-foreground">{u.name}</h4>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-0.5">
                      <span>{u.phone || u.email}</span>
                      {u.place && <span>• {u.place}</span>}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <Badge variant="success" className="text-xs font-extrabold">
                    {u.totalCount.toLocaleString('en-IN')} Salath
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
