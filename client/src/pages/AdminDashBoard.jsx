import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import AnalyticsCard from "./AnalyticsCard";

function AdminDashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('userRole');
  const isAdmin = !!(token && (userRole === 'tenant_admin' || userRole === 'super_admin'));

  useEffect(() => {
    if (!isAdmin) navigate('/admin');
  }, [isAdmin, navigate]);

  const [totalAmount, setTotalAmount] = useState(0);
  const [topUsers, setTopUsers] = useState([]);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    if (!isAdmin) return;
    const fetchDashboard = async () => {
      try {
        const data = await api("/admin/dashboard", { method: "GET", token });

        setTotalAmount(data.totalAmount || 0);
        setTopUsers(data.topUsers || []);

        const formattedChartData = (data.graphData || []).map((item) => ({
          date: item._id,
          value: item.total,
        }));

        setChartData(formattedChartData);
      } catch (err) {
        console.error("Error fetching dashboard:", err);
      }
    };

    fetchDashboard();
  }, [isAdmin]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 font-ml space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Admin Analytics Dashboard</h1>

      {/* Total Amount */}
      <Card>
        <CardContent className="p-5">
          <h2 className="text-sm font-semibold text-muted-foreground">ആകെ ശേഖരിച്ച സംഖ്യ (Total Count)</h2>
          <p className="text-3xl font-extrabold text-foreground mt-1">
            {Number(totalAmount).toLocaleString('en-IN')}
          </p>
        </CardContent>
      </Card>

      {/* Top Users */}
      <div>
        <h2 className="text-lg font-bold mb-3 text-foreground">🏆 Top 4 Users</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {topUsers.map((user, idx) => (
            <Card key={idx}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-muted-foreground">
                    Rank #{idx + 1}
                  </span>
                  <Badge variant="success">
                    {Number(user.total).toLocaleString('en-IN')}
                  </Badge>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/15 text-secondary font-bold text-base flex items-center justify-center shrink-0">
                    {user.name ? user.name.charAt(0) : '?'}
                  </div>
                  <h3 className="text-sm font-bold text-foreground truncate">
                    {user.name}
                  </h3>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Analytics Chart */}
      <Card>
        <CardContent className="p-5">
          <h2 className="text-base font-bold text-foreground mb-3">വിവരഗ്രാഫ് (Analytics Chart)</h2>
          <AnalyticsCard chartData={chartData} />
        </CardContent>
      </Card>
    </div>
  );
}

export default AdminDashboard;
