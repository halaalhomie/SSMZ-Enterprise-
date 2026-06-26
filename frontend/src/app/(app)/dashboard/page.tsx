'use client';
import {
  Package, IndianRupee, AlertTriangle, ArrowDownToLine, ArrowUpFromLine,
  Truck, Tag, TrendingUp, TrendingDown, MinusCircle
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { useDashboardStats, useStockMovement, useCategoryDistribution, useMovers } from '@/hooks/useApi';

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4', '#a855f7', '#ec4899'];

function StatCard({ icon: Icon, label, value, sub, color }: any) {
  return (
    <div className="card p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 dark:text-slate-400">{label}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
          {sub && <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">{sub}</p>}
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { data: stats, isLoading } = useDashboardStats();
  const { data: movement = [] } = useStockMovement(30);
  const { data: categoryDist = [] } = useCategoryDistribution();
  const { data: movers } = useMovers(30);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card p-4 h-24 animate-pulse bg-gray-100 dark:bg-slate-700" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-sm text-gray-500 dark:text-slate-400">Overview of your store inventory</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Package}
          label="Total Products"
          value={stats?.total_products ?? 0}
          color="bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400"
        />
        <StatCard
          icon={IndianRupee}
          label="Inventory Value"
          value={`₹${Number(stats?.total_inventory_value ?? 0).toLocaleString('en-IN')}`}
          color="bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
        />
        <StatCard
          icon={AlertTriangle}
          label="Low Stock Items"
          value={stats?.low_stock_count ?? 0}
          sub={stats && stats.low_stock_count > 0 ? 'Needs reorder' : 'All good'}
          color="bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
        />
        <StatCard
          icon={Tag}
          label="Categories"
          value={stats?.total_categories ?? 0}
          sub={`${stats?.total_suppliers ?? 0} suppliers`}
          color="bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
        />
      </div>

      {/* Today's transactions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard
          icon={ArrowDownToLine}
          label="Today's Stock In"
          value={stats?.today_stock_in ?? 0}
          sub="transactions today"
          color="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
        />
        <StatCard
          icon={ArrowUpFromLine}
          label="Today's Stock Out"
          value={stats?.today_stock_out ?? 0}
          sub="transactions today"
          color="bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card p-4 lg:col-span-2">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Stock Movement (30 days)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={movement}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="var(--text-secondary)" />
              <YAxis tick={{ fontSize: 11 }} stroke="var(--text-secondary)" />
              <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
              <Legend />
              <Line type="monotone" dataKey="stock_in" stroke="#22c55e" name="Stock In" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="stock_out" stroke="#ef4444" name="Stock Out" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Inventory by Category</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={categoryDist}
                dataKey="count"
                nameKey="category"
                cx="50%"
                cy="50%"
                outerRadius={90}
                label={({ category, count }) => `${category}: ${count}`}
                labelLine={false}
              >
                {categoryDist.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Movers */}
      {movers && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="card p-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-500" /> Fast Moving
            </h3>
            <ul className="space-y-2">
              {movers.fast_movers?.slice(0, 5).map((p: any) => (
                <li key={p.id} className="flex justify-between text-sm">
                  <span className="text-gray-700 dark:text-slate-300 truncate">{p.name}</span>
                  <span className="font-medium text-gray-900 dark:text-white">{p.moved}</span>
                </li>
              ))}
              {(!movers.fast_movers || movers.fast_movers.length === 0) && (
                <p className="text-sm text-gray-400">No data yet</p>
              )}
            </ul>
          </div>

          <div className="card p-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-amber-500" /> Slow Moving
            </h3>
            <ul className="space-y-2">
              {movers.slow_movers?.slice(0, 5).map((p: any) => (
                <li key={p.id} className="flex justify-between text-sm">
                  <span className="text-gray-700 dark:text-slate-300 truncate">{p.name}</span>
                  <span className="font-medium text-gray-900 dark:text-white">{p.moved}</span>
                </li>
              ))}
              {(!movers.slow_movers || movers.slow_movers.length === 0) && (
                <p className="text-sm text-gray-400">No data yet</p>
              )}
            </ul>
          </div>

          <div className="card p-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <MinusCircle className="w-4 h-4 text-red-500" /> Dead Inventory
            </h3>
            <ul className="space-y-2">
              {movers.dead_inventory?.slice(0, 5).map((p: any) => (
                <li key={p.id} className="flex justify-between text-sm">
                  <span className="text-gray-700 dark:text-slate-300 truncate">{p.name}</span>
                  <span className="badge-red">0 sold</span>
                </li>
              ))}
              {(!movers.dead_inventory || movers.dead_inventory.length === 0) && (
                <p className="text-sm text-gray-400">No dead stock 🎉</p>
              )}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
