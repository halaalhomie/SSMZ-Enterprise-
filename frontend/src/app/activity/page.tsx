'use client';
import { useState } from 'react';
import { format } from 'date-fns';
import { useActivityLogs } from '@/hooks/useApi';

const actionLabels: Record<string, string> = {
  user_login: 'User logged in',
  product_created: 'Product created',
  product_updated: 'Product updated',
  product_deleted: 'Product deleted',
  stock_in: 'Stock added',
  stock_out: 'Stock removed',
  audit_created: 'Audit recorded',
  supplier_created: 'Supplier added',
  password_changed: 'Password changed',
};

export default function ActivityPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useActivityLogs({ page });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Activity Logs</h1>
        <p className="text-sm text-gray-500 dark:text-slate-400">Audit trail of every action in the system</p>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-slate-700/50">
              <tr>
                <th className="table-header">Action</th>
                <th className="table-header">User</th>
                <th className="table-header">Details</th>
                <th className="table-header">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
              {isLoading && <tr><td colSpan={4} className="table-cell text-center py-8 text-gray-400">Loading...</td></tr>}
              {!isLoading && data?.items?.length === 0 && (
                <tr><td colSpan={4} className="table-cell text-center py-8 text-gray-400">No activity recorded</td></tr>
              )}
              {data?.items?.map((log: any) => (
                <tr key={log.id}>
                  <td className="table-cell font-medium">{actionLabels[log.action] || log.action}</td>
                  <td className="table-cell text-gray-500 dark:text-slate-400">{log.user?.name || 'System'}</td>
                  <td className="table-cell text-gray-500 dark:text-slate-400 text-xs">
                    {Object.entries(log.extra_data || {}).map(([k, v]) => `${k}: ${v}`).join(', ') || '—'}
                  </td>
                  <td className="table-cell text-gray-500 dark:text-slate-400 text-xs">{format(new Date(log.created_at), 'dd MMM yyyy, HH:mm:ss')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data && data.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-slate-700">
            <p className="text-sm text-gray-500 dark:text-slate-400">Page {data.page} of {data.pages}</p>
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
