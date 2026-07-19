'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { ArrowUpFromLine, Search, AlertTriangle } from 'lucide-react';
import { useProducts, useStockOut } from '@/hooks/useApi';

const schema = z.object({
  product_id: z.string().min(1, 'Select a product'),
  quantity: z.coerce.number().int().positive('Must be greater than 0'),
  reason: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

const reasons = ['Sale', 'Damaged', 'Expired', 'Returned to supplier', 'Internal use', 'Other'];

export default function StockOutPage() {
  const [search, setSearch] = useState('');
  const { data: products } = useProducts({ search: search || undefined, page_size: 10 });
  const stockOutMutation = useStockOut();

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const selectedProductId = watch('product_id');
  const quantity = watch('quantity');
  const selectedProduct = products?.items.find(p => p.id === selectedProductId);
  const exceedsStock = selectedProduct && quantity > selectedProduct.quantity;

  const onSubmit = async (data: FormData) => {
    if (exceedsStock) {
        toast.error("Cannot remove more stock than available.");
        return;
    }
    try {
      await stockOutMutation.mutateAsync({ ...data, reason: data.reason || undefined });
      toast.success(`Stock removed: -${data.quantity} units`);
      reset();
      setSearch('');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to remove stock');
    }
  };

  return (
    <div className="max-w-2xl space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <ArrowUpFromLine className="w-6 h-6 text-red-600" /> Stock Out
        </h1>
        <p className="text-sm text-gray-500 dark:text-slate-400">Record outgoing inventory (sales, damage, etc.)</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="card p-6 space-y-4">
        <div>
          <label className="label">Search Product</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, SKU, or barcode..."
              className="input pl-9"
            />
          </div>
        </div>

        <div>
          <label className="label">Product</label>
          <select {...register('product_id')} className="input">
            <option value="">Select a product</option>
            {products?.items.map((p) => (
              <option key={p.id} value={p.id}>{p.name} ({p.sku}) — available: {p.quantity}</option>
            ))}
          </select>
          {errors.product_id && <p className="text-xs text-red-500 mt-1">{errors.product_id.message}</p>}
        </div>

        {selectedProduct && (
          <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-3 text-sm text-blue-800 dark:text-blue-300">
            Available quantity: <strong>{selectedProduct.quantity}</strong>
          </div>
        )}

        <div>
          <label className="label">Quantity to Remove</label>
          <input {...register('quantity')} type="number" min="1" className="input" placeholder="e.g. 5" />
          {errors.quantity && <p className="text-xs text-red-500 mt-1">{errors.quantity.message}</p>}
          {exceedsStock && (
            <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Exceeds available stock ({selectedProduct?.quantity})
            </p>
          )}
        </div>

        <div>
          <label className="label">Reason</label>
          <select {...register('reason')} className="input">
            <option value="">Select reason</option>
            {reasons.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        <button
          type="submit"
          className="btn-danger w-full justify-center"
          disabled={stockOutMutation.isPending || !!exceedsStock}
        >
          {stockOutMutation.isPending ? 'Removing...' : 'Remove Stock'}
        </button>
      </form>
    </div>
  );
}
