'use client';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, ArrowDownToLine, ArrowUpFromLine, Settings2 } from 'lucide-react';
import { format } from 'date-fns';
import { useProduct, useProductHistory } from '@/hooks/useApi';

const typeConfig = {
  stock_in: { icon: ArrowDownToLine, color: 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400', label: 'Stock In' },
  stock_out: { icon: ArrowUpFromLine, color: 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400', label: 'Stock Out' },
  adjustment: { icon: Settings2, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400', label: 'Adjustment' },
};

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [page, setPage] = useState(1);

  const { data: product, isLoading: productLoading } = useProduct(id);
  const { data: history, isLoading: historyLoading } = useProductHistory(id, page);

  if (productLoading) return <p className="text-gray-400">Loading...</p>;
  if (!product) return <p className="text-gray-400">Product not found</p>;

  return (
    <div className="space-y-4">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:text-slate-400">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      {/* Product summary */}
      <div className="card p-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="col-span-2 sm:col-span-4">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">{product.name}</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400">SKU: {product.sku} {product.barcode && `· Barcode: ${product.barcode}`}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Current Stock</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">{product.quantity}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Min Stock</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">{product.min_stock}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Purchase Price</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">₹{Number(product.purchase_price).toFixed(2)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Selling Price</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">₹{Number(product.selling_price).toFixed(2)}</p>
        </div>
      </div>

      {/* History */}
      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Transaction History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-slate-700/50">
              <tr>
                <th className="table-header">Type</th>
                <th className="table-header text-right">Quantity</th>
                <th className="table-header">User</th>
                <th className="table-header">Reason / Remarks</th>
                <th className="table-header">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
              {historyLoading && <tr><td colSpan={5} className="table-cell text-center py-8 text-gray-400">Loading...</td></tr>}
              {!historyLoading && history?.items.length === 0 && (
                <tr><td colSpan={5} className="table-cell text-center py-8 text-gray-400">No transactions yet</td></tr>
              )}
              {history?.items.map((t: any) => {
                const cfg = typeConfig[t.type as keyof typeof typeConfig] || typeConfig.adjustment;
                const Icon = cfg.icon;
                return (
                  <tr key={t.id}>
                    <td className="table-cell">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.color}`}>
                        <Icon className="w-3 h-3" /> {cfg.label}
                      </span>
                    </td>
                    <td className="table-cell text-right font-medium">{t.quantity}</td>
                    <td className="table-cell">{t.user?.name || '—'}</td>
                    <td className="table-cell text-gray-500 dark:text-slate-400">{t.reason || t.remarks || '—'}</td>
                    <td className="table-cell text-gray-500 dark:text-slate-400">{format(new Date(t.created_at), 'dd MMM yyyy, HH:mm')}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {history && history.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-slate-700">
            <p className="text-sm text-gray-500 dark:text-slate-400">Page {history.page} of {history.pages}</p>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="btn-secondary text-xs px-3 py-1.5">Previous</button>
              <button disabled={page >= history.pages} onClick={() => setPage(p => p + 1)} className="btn-secondary text-xs px-3 py-1.5">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
