'use client';
import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { ArrowDownToLine, Search } from 'lucide-react';
import { useProducts, useSuppliers, useStockIn } from '@/hooks/useApi';

const schema = z.object({
  product_id: z.string().min(1, 'Select a product'),
  quantity: z.coerce.number().int().positive('Must be greater than 0'),
  supplier_id: z.string().optional(),
  invoice_number: z.string().optional(),
  cost_per_unit: z.coerce.number().min(0).optional(),
  remarks: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export default function StockInPage() {
  const [search, setSearch] = useState('');
  const { data: products } = useProducts({ search: search || undefined, page_size: 10 });
  const { data: suppliers } = useSuppliers();
  const stockInMutation = useStockIn();

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const selectedProductId = watch('product_id');
  const selectedProduct = products?.items.find(p => p.id === selectedProductId);

  const onSubmit = async (data: FormData) => {
    const payload = {
      ...data,
      supplier_id: data.supplier_id || undefined,
      invoice_number: data.invoice_number || undefined,
      cost_per_unit: data.cost_per_unit || undefined,
      remarks: data.remarks || undefined,
    };
    try {
      await stockInMutation.mutateAsync(payload);
      toast.success(`Stock added: +${data.quantity} units`);
      reset();
      setSearch('');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to add stock');
    }
  };

  return (
    <div className="max-w-2xl space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <ArrowDownToLine className="w-6 h-6 text-green-600" /> Stock In
        </h1>
        <p className="text-sm text-gray-500 dark:text-slate-400">Record incoming inventory from suppliers</p>
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
              <option key={p.id} value={p.id}>{p.name} ({p.sku}) — current: {p.quantity}</option>
            ))}
          </select>
          {errors.product_id && <p className="text-xs text-red-500 mt-1">{errors.product_id.message}</p>}
        </div>

        {selectedProduct && (
          <div className="rounded-lg bg-green-50 dark:bg-green-900/20 p-3 text-sm text-green-800 dark:text-green-300">
            Current quantity: <strong>{selectedProduct.quantity}</strong>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Quantity to Add</label>
            <input {...register('quantity')} type="number" min="1" className="input" placeholder="e.g. 50" />
            {errors.quantity && <p className="text-xs text-red-500 mt-1">{errors.quantity.message}</p>}
          </div>
          <div>
            <label className="label">Cost per Unit (₹)</label>
            <input {...register('cost_per_unit')} type="number" step="0.01" className="input" placeholder="optional" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Supplier</label>
            <select {...register('supplier_id')} className="input">
              <option value="">None</option>
              {suppliers?.items?.map((s: any) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Invoice Number</label>
            <input {...register('invoice_number')} className="input" placeholder="optional" />
          </div>
        </div>

        <div>
          <label className="label">Remarks</label>
          <textarea {...register('remarks')} className="input" rows={2} placeholder="optional notes..." />
        </div>

        <button type="submit" className="btn-primary w-full justify-center" disabled={stockInMutation.isPending}>
          {stockInMutation.isPending ? 'Adding...' : 'Add Stock'}
        </button>
      </form>
    </div>
  );
}
