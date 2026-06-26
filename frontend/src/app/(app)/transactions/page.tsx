'use client';
import { useState } from 'react';
import { ArrowDownToLine, ArrowUpFromLine, Settings2, Download } from 'lucide-react';
import { format } from 'date-fns';
import { useLedger } from '@/hooks/useApi';
import api from '@/lib/api';
import toast from 'react-hot-toast';

const typeConfig: Record<string, { icon: any; color: string; label: string }> = {
  stock_in: { icon: ArrowDownToLine, color: 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400', label: 'Stock In' },
  stock_out: { icon: ArrowUpFromLine, color: 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400', label: 'Stock Out' },
  adjustment: { icon: Settings2, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400', label: 'Adjustment' },
};

export default function TransactionsPage() {
  const [page, setPage] = useState(1);
  const [type, setType] = useState('');

  const { data, isLoading } = useLedger({ page, transaction_type: type || undefined });

  const handleExport = async (format_: 'csv' | 'pdf' | 'excel') => {
    toast.success(`Exporting ${format_.toUpperCase()}... (download will start shortly)`);
    // In production: GET /export/transactions?format=csv
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Transaction Ledger</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400">Complete stock movement history</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => handleExport('csv')} className="btn-secondary text-sm">
            <Download className="w-4 h-4" /> CSV
          </button>
          <button onClick={() => handleExport('pdf')} className="btn-secondary text-sm">
            <Download className="w-4 h-4" /> PDF
          </button>
        </div>
      </div>

      <div className="card p-3 flex gap-3">
        <select value={type} onChange={(e) => { setType(e.target.value); setPage(1); }} className="input sm:w-48">
          <option value="">All Types</option>
          <option value="stock_in">Stock In</option>
          <option value="stock_out">Stock Out</option>
          <option value="adjustment">Adjustment</option>
        </select>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-slate-700/50">
              <tr>
                <th className="table-header">Type</th>
                <th className="table-header">Product</th>
                <th className="table-header text-right">Quantity</th>
                <th className="table-header">User</th>
                <th className="table-header">Supplier</th>
                <th className="table-header">Reason / Invoice</th>
                <th className="table-header">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
              {isLoading && <tr><td colSpan={7} className="table-cell text-center py-8 text-gray-400">Loading...</td></tr>}
              {!isLoading && data?.items.length === 0 && (
                <tr><td colSpan={7} className="table-cell text-center py-8 text-gray-400">No transactions found</td></tr>
              )}
              {data?.items.map((t) => {
                const cfg = typeConfig[t.type] || typeConfig.adjustment;
                const Icon = cfg.icon;
                return (
                  <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30">
                    <td className="table-cell">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.color}`}>
                        <Icon className="w-3 h-3" /> {cfg.label}
                      </span>
                    </td>
                    <td className="table-cell font-medium">{t.product?.name || '—'}</td>
                    <td className="table-cell text-right font-medium">{t.quantity}</td>
                    <td className="table-cell text-gray-500 dark:text-slate-400">{t.user?.name || '—'}</td>
                    <td className="table-cell text-gray-500 dark:text-slate-400">{t.supplier?.name || '—'}</td>
                    <td className="table-cell text-gray-500 dark:text-slate-400">{t.reason || t.invoice_number || '—'}</td>
                    <td className="table-cell text-gray-500 dark:text-slate-400">{format(new Date(t.created_at), 'dd MMM yyyy, HH:mm')}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {data && data.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-slate-700">
            <p className="text-sm text-gray-500 dark:text-slate-400">Page {data.page} of {data.pages} ({data.total} transactions)</p>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="btn-secondary text-xs px-3 py-1.5">Previous</button>
              <button disabled={page >= data.pages} onClick={() => setPage(p => p + 1)} className="btn-secondary text-xs px-3 py-1.5">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
