import { useState } from 'react';
import type { Order, Product, RestockItem, ActivityLog as ActivityLogEntry } from '../types';
import { ShoppingCart, Clock, AlertTriangle, DollarSign, TrendingUp } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

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
  const [orders] = useState<Order[]>([]);
  const [products] = useState<Product[]>([]);
  const [restockQueue] = useState<RestockItem[]>([]);
  const [activityLogs] = useState<ActivityLogEntry[]>([]);

  const today = new Date().toDateString();
  const todayOrders = orders.filter(o => new Date(o.createdAt).toDateString() === today);
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const completedOrders = orders.filter(o => o.status === 'delivered').length;
  const revenueToday = todayOrders.reduce((sum, o) => sum + o.totalPrice, 0);

  const statusCounts = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'].map(s => ({
    status: s.charAt(0).toUpperCase() + s.slice(1),
    count: orders.filter(o => o.status === s).length,
  }));

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900">Dashboard</h2>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Orders Today"
          value={todayOrders.length}
          icon={ShoppingCart}
          color="bg-blue-50 text-blue-600"
        />
        <StatCard
          label="Pending Orders"
          value={pendingOrders}
          sub={`${completedOrders} delivered`}
          icon={Clock}
          color="bg-yellow-50 text-yellow-600"
        />
        <StatCard
          label="Low Stock Items"
          value={restockQueue.length}
          icon={AlertTriangle}
          color="bg-red-50 text-red-600"
        />
        <StatCard
          label="Revenue Today"
          value={`$${revenueToday.toFixed(2)}`}
          icon={DollarSign}
          color="bg-green-50 text-green-600"
        />
      </div>

      {/* Chart + Product Summary */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Order Status Chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={18} className="text-gray-500" />
            <h3 className="font-semibold text-gray-900">Orders by Status</h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={statusCounts} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="status" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Product Summary */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Product Summary</h3>
          <div className="space-y-3 max-h-52 overflow-y-auto">
            {products.map(p => {
              const isLow = p.stock < p.minStockThreshold;
              const isOut = p.stock === 0;
              return (
                <div key={p.id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">{p.name}</span>
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full
                      ${isOut ? 'bg-red-100 text-red-700'
                        : isLow ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-green-100 text-green-700'}`}
                  >
                    {p.stock} left · {isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'OK'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Activity Log */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-900 mb-4">Recent Activity</h3>
        {activityLogs.length === 0 ? (
          <p className="text-sm text-gray-400">No activity yet.</p>
        ) : (
          <ul className="space-y-2">
            {activityLogs.slice(0, 5).map(log => (
              <li key={log.id} className="flex items-start gap-3 text-sm">
                <span className="text-gray-400 shrink-0 text-xs pt-0.5">
                  {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className="text-gray-700">{log.message}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
