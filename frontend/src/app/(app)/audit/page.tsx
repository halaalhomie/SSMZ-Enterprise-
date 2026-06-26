'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { ClipboardCheck, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { useProducts, useCreateAudit, useAudits } from '@/hooks/useApi';

const schema = z.object({
  product_id: z.string().min(1, 'Select a product'),
  physical_quantity: z.coerce.number().int().min(0, 'Must be >= 0'),
  notes: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export default function AuditPage() {
  const [search, setSearch] = useState('');
  const { data: products } = useProducts({ search: search || undefined, page_size: 10 });
  const { data: audits, isLoading: auditsLoading } = useAudits({ page: 1 });
  const createAuditMutation = useCreateAudit();

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const selectedProductId = watch('product_id');
  const physicalQty = watch('physical_quantity');
  const selectedProduct = products?.items.find(p => p.id === selectedProductId);
  const difference = selectedProduct && physicalQty !== undefined ? physicalQty - selectedProduct.quantity : null;

  const onSubmit = async (data: FormData) => {
    try {
      const audit = await createAuditMutation.mutateAsync({ ...data, notes: data.notes || undefined });
      toast.success(`Audit recorded — difference: ${audit.difference > 0 ? '+' : ''}${audit.difference}`);
      reset();
      setSearch('');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <ClipboardCheck className="w-6 h-6 text-indigo-600" /> Inventory Audit
        </h1>
        <p className="text-sm text-gray-500 dark:text-slate-400">Compare physical inventory with database records</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Audit form */}
        <form onSubmit={handleSubmit(onSubmit)} className="card p-6 space-y-4">
          <h2 className="font-semibold text-gray-900 dark:text-white">New Audit</h2>

          <div>
            <label className="label">Search Product</label>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or SKU..." className="input" />
          </div>

          <div>
            <label className="label">Product</label>
            <select {...register('product_id')} className="input">
              <option value="">Select a product</option>
              {products?.items.map((p) => (
                <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
              ))}
            </select>
            {errors.product_id && <p className="text-xs text-red-500 mt-1">{errors.product_id.message}</p>}
          </div>

          {selectedProduct && (
            <div className="rounded-lg bg-gray-50 dark:bg-slate-700/50 p-4 flex items-center justify-between text-sm">
              <div>
                <p className="text-gray-400 text-xs">Database Quantity</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{selectedProduct.quantity}</p>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-gray-400 text-xs">Physical Quantity</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{physicalQty ?? '—'}</p>
              </div>
              <div className="text-right">
                <p className="text-gray-400 text-xs">Difference</p>
                <p className={`text-xl font-bold ${difference === 0 ? 'text-green-600' : difference !== null && difference < 0 ? 'text-red-600' : 'text-blue-600'}`}>
                  {difference !== null ? (difference > 0 ? `+${difference}` : difference) : '—'}
                </p>
              </div>
            </div>
          )}

          <div>
            <label className="label">Physical Quantity Counted</label>
            <input {...register('physical_quantity')} type="number" min="0" className="input" placeholder="Enter counted quantity" />
            {errors.physical_quantity && <p className="text-xs text-red-500 mt-1">{errors.physical_quantity.message}</p>}
          </div>

          <div>
            <label className="label">Notes</label>
            <textarea {...register('notes')} className="input" rows={2} placeholder="optional remarks..." />
          </div>

          <button type="submit" className="btn-primary w-full justify-center" disabled={createAuditMutation.isPending}>
            {createAuditMutation.isPending ? 'Recording...' : 'Record Audit'}
          </button>
        </form>

        {/* Recent audits */}
        <div className="card overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700">
            <h2 className="font-semibold text-gray-900 dark:text-white">Recent Audits</h2>
          </div>
          <div className="overflow-x-auto max-h-[480px] overflow-y-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-slate-700/50 sticky top-0">
                <tr>
                  <th className="table-header">Product</th>
                  <th className="table-header text-right">DB</th>
                  <th className="table-header text-right">Physical</th>
                  <th className="table-header text-right">Diff</th>
                  <th className="table-header">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                {auditsLoading && <tr><td colSpan={5} className="table-cell text-center py-8 text-gray-400">Loading...</td></tr>}
                {!auditsLoading && audits?.items?.length === 0 && (
                  <tr><td colSpan={5} className="table-cell text-center py-8 text-gray-400">No audits yet</td></tr>
                )}
                {audits?.items?.map((a: any) => (
                  <tr key={a.id}>
                    <td className="table-cell font-medium">{a.product?.name || '—'}</td>
                    <td className="table-cell text-right">{a.db_quantity}</td>
                    <td className="table-cell text-right">{a.physical_quantity}</td>
                    <td className={`table-cell text-right font-medium ${a.difference === 0 ? 'text-green-600' : a.difference < 0 ? 'text-red-600' : 'text-blue-600'}`}>
                      {a.difference > 0 ? `+${a.difference}` : a.difference}
                    </td>
                    <td className="table-cell text-gray-500 dark:text-slate-400 text-xs">{format(new Date(a.created_at), 'dd MMM, HH:mm')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
