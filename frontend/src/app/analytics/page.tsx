'use client';
import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  LineChart, Line,
} from 'recharts';
import { TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { useStockMovement, useMovers, useCategoryDistribution, useDiscrepancyReport } from '@/hooks/useApi';

export default function AnalyticsPage() {
  const [days, setDays] = useState(30);
  const { data: movement = [] } = useStockMovement(days);
  const { data: movers } = useMovers(days);
  const { data: categories = [] } = useCategoryDistribution();
  const { data: discrepancies } = useDiscrepancyReport();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400">Trends and inventory intelligence</p>
        </div>
        <select value={days} onChange={(e) => setDays(Number(e.target.value))} className="input w-40">
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      {/* Stock movement trend */}
      <div className="card p-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Inventory Value Trend</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={movement}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="var(--text-secondary)" />
            <YAxis tick={{ fontSize: 11 }} stroke="var(--text-secondary)" />
            <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
            <Legend />
            <Line type="monotone" dataKey="stock_in" stroke="#22c55e" name="Stock In" strokeWidth={2} />
            <Line type="monotone" dataKey="stock_out" stroke="#ef4444" name="Stock Out" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Category value bar chart */}
      <div className="card p-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Inventory Value by Category</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={categories}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="category" tick={{ fontSize: 11 }} stroke="var(--text-secondary)" />
            <YAxis tick={{ fontSize: 11 }} stroke="var(--text-secondary)" />
            <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
            <Bar dataKey="value" fill="#6366f1" name="Value (₹)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Movers + discrepancies */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-500" /> Fast Moving Products
          </h3>
          <div className="overflow-y-auto max-h-72">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                {movers?.fast_movers?.map((p: any) => (
                  <tr key={p.id}>
                    <td className="py-2 text-gray-700 dark:text-slate-300">{p.name}</td>
                    <td className="py-2 text-right font-medium text-gray-900 dark:text-white">{p.moved} sold</td>
                  </tr>
                ))}
                {(!movers?.fast_movers || movers.fast_movers.length === 0) && (
                  <tr><td className="py-4 text-gray-400 text-center">No data</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card p-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500" /> Stock Discrepancies (cumulative)
          </h3>
          <div className="overflow-y-auto max-h-72">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                {discrepancies?.discrepancies?.map((d: any) => (
                  <tr key={d.product_id}>
                    <td className="py-2 text-gray-700 dark:text-slate-300 font-mono text-xs">{d.product_id.slice(0, 8)}...</td>
                    <td className="py-2 text-right">{d.audit_count} audits</td>
                    <td className={`py-2 text-right font-medium ${d.total_difference < 0 ? 'text-red-600' : 'text-blue-600'}`}>
                      {d.total_difference > 0 ? `+${d.total_difference}` : d.total_difference}
                    </td>
                  </tr>
                ))}
                {(!discrepancies?.discrepancies || discrepancies.discrepancies.length === 0) && (
                  <tr><td className="py-4 text-gray-400 text-center" colSpan={3}>No discrepancies found 🎉</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
