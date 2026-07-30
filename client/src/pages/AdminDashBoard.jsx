import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import AnalyticsCard from "./AnalyticsCard";

function AdminDashboard() {
  const navigate = useNavigate();
  const isAdmin = sessionStorage.getItem('isAdmin') === '1';

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
        const data = await api("/admin/dashboard", { method: "GET" });

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
    <div className="max-w-5xl mx-auto px-4 py-8 font-ml">
      <h1 className="text-2xl font-bold text-primary-950 mb-6">Admin Analytics Dashboard</h1>

      {/* Total Amount */}
      <div className="mb-6 bg-white shadow-touch border border-stone-200/90 rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-stone-600">ആകെ ശേഖരിച്ച സംഖ്യ (Total Count)</h2>
        <p className="text-3xl font-extrabold text-primary-900 mt-1">
          {Number(totalAmount).toLocaleString('en-IN')}
        </p>
      </div>

      {/* Top Users */}
      <div className="mb-6">
        <h2 className="text-lg font-bold mb-3 text-stone-900">🏆 Top 4 Users</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {topUsers.map((user, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-stone-200/90 shadow-touch p-4 transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-stone-500">
                  Rank #{idx + 1}
                </span>
                <span className="text-[10px] bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                  {Number(user.total).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gold-400 text-stone-950 font-bold text-base flex items-center justify-center shrink-0">
                  {user.name ? user.name.charAt(0) : '?'}
                </div>
                <h3 className="text-sm font-bold text-stone-900 truncate">
                  {user.name}
                </h3>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Analytics Chart */}
      <div className="bg-white border border-stone-200/90 shadow-touch rounded-2xl p-5">
        <h2 className="text-base font-bold text-stone-900 mb-3">വിവരഗ്രാഫ് (Analytics Chart)</h2>
        <AnalyticsCard chartData={chartData} />
      </div>
    </div>
  );
}

export default AdminDashboard;
