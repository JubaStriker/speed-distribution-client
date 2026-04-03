import { useState, useEffect } from 'react';
import { ShoppingCart, Clock, AlertTriangle, TrendingUp, Package, ClipboardList } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { analyticsApi, activityApi, type AnalyticsData } from '../api';
import type { OrderStatus, ActivityLog } from '../types';

const STATUS_STYLES: Record<OrderStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

function StatCard({
  label, value, sub, icon: Icon, color,
}: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; color: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        </div>
        <div className={`p-2.5 rounded-lg ${color}`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);

  useEffect(() => {
    analyticsApi.get()
      .then(setAnalytics)
      .catch(e => setError(e.message ?? 'Failed to load analytics'))
      .finally(() => setLoading(false));
    activityApi.list({ page: 1, limit: 5 })
      .then(res => setActivityLogs(res.data))
      .catch(() => {});
  }, []);

  const statusChartData = analytics
    ? (['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'] as const).map(s => ({
        status: s.charAt(0).toUpperCase() + s.slice(1),
        count: analytics.orders_by_status[s] ?? 0,
      }))
    : [];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900">Dashboard</h2>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Orders Today"
          value={loading ? '—' : analytics?.total_orders_today ?? 0}
          icon={ShoppingCart}
          color="bg-blue-50 text-blue-600"
        />
        <StatCard
          label="Pending Orders"
          value={loading ? '—' : analytics?.pending_orders_today ?? 0}
          sub={analytics ? `${analytics.orders_by_status.delivered} delivered` : undefined}
          icon={Clock}
          color="bg-yellow-50 text-yellow-600"
        />
        <StatCard
          label="Low Stock Items"
          value={loading ? '—' : analytics?.low_stock_count ?? 0}
          icon={AlertTriangle}
          color="bg-red-50 text-red-600"
        />
        <StatCard
          label="Revenue Today"
          value={loading ? '—' : `৳${(analytics?.revenue_today ?? 0).toFixed(2)}`}
          icon={() => <span className="text-lg font-bold leading-none">৳</span>}
          color="bg-green-50 text-green-600"
        />
      </div>

      {/* Chart + Latest Orders */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Order Status Chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={18} className="text-gray-500" />
            <h3 className="font-semibold text-gray-900">Orders by Status</h3>
          </div>
          {loading ? (
            <div className="h-[200px] flex items-center justify-center text-sm text-gray-400">Loading…</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={statusChartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="status" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Latest Orders */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Package size={18} className="text-gray-500" />
            <h3 className="font-semibold text-gray-900">Latest Orders</h3>
          </div>
          {loading ? (
            <p className="text-sm text-gray-400">Loading…</p>
          ) : !analytics?.latest_orders.length ? (
            <p className="text-sm text-gray-400">No orders yet.</p>
          ) : (
            <div className="space-y-3">
              {analytics.latest_orders.map(order => (
                <div key={order.id} className="flex items-center justify-between text-sm">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-800 truncate">{order.customerName}</p>
                    <p className="text-xs text-gray-400">
                      {order.orderId ?? order.id} · {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_STYLES[order.status]}`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                    <span className="text-xs font-semibold text-gray-700">${order.totalPrice.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
          <ClipboardList size={18} className="text-gray-500" />
          <h3 className="font-semibold text-gray-900">Recent Activity</h3>
        </div>
        {activityLogs.length === 0 ? (
          <p className="px-5 py-6 text-sm text-gray-400">No activity recorded yet.</p>
        ) : (
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-5 py-2.5 text-left font-semibold text-gray-600">Message</th>
                <th className="px-5 py-2.5 text-left font-semibold text-gray-600 whitespace-nowrap">User</th>
                <th className="px-5 py-2.5 text-left font-semibold text-gray-600 whitespace-nowrap">Date & Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {activityLogs.map(log => {
                const date = new Date(log.timestamp);
                return (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 text-gray-700">{log.message}</td>
                    <td className="px-5 py-3 text-gray-500 whitespace-nowrap">{log.userEmail ?? '—'}</td>
                    <td className="px-5 py-3 text-gray-500 whitespace-nowrap">
                      {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
