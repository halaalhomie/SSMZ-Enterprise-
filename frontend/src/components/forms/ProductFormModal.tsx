'use client';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import { Product } from '@/types';
import { useCategories, useCreateProduct, useUpdateProduct } from '@/hooks/useApi';

const schema = z.object({
  name: z.string().min(1, 'Required'),
  sku: z.string().min(1, 'Required'),
  barcode: z.string().optional(),
  category_id: z.string().optional(),
  purchase_price: z.coerce.number().min(0, 'Must be >= 0'),
  selling_price: z.coerce.number().min(0, 'Must be >= 0'),
  quantity: z.coerce.number().int().min(0, 'Must be >= 0'),
  min_stock: z.coerce.number().int().min(0, 'Must be >= 0'),
});
type FormData = z.infer<typeof schema>;

export default function ProductFormModal({
  product,
  onClose,
}: {
  product?: Product | null;
  onClose: () => void;
}) {
  const { data: categories = [] } = useCategories();
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct(product?.id || '');

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '', sku: '', barcode: '', category_id: '',
      purchase_price: 0, selling_price: 0, quantity: 0, min_stock: 5,
    },
  });

  useEffect(() => {
    if (product) {
      reset({
        name: product.name,
        sku: product.sku,
        barcode: product.barcode || '',
        category_id: product.category_id || '',
        purchase_price: product.purchase_price,
        selling_price: product.selling_price,
        quantity: product.quantity,
        min_stock: product.min_stock,
      });
    }
  }, [product, reset]);

  const onSubmit = async (data: FormData) => {
    const payload = {
      ...data,
      category_id: data.category_id || undefined,
      barcode: data.barcode || undefined,
    };
    try {
      if (product) {
        // quantity not editable directly via update
        const { quantity, ...updatePayload } = payload;
        await updateMutation.mutateAsync(updatePayload);
        toast.success('Product updated');
      } else {
        await createMutation.mutateAsync(payload);
        toast.success('Product created');
      }
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Something went wrong');
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="card w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {product ? 'Edit Product' : 'Add Product'}
          </h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">Product Name</label>
            <input {...register('name')} className="input" placeholder="e.g. Maggi Noodles" />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">SKU</label>
              <input {...register('sku')} className="input" placeholder="MAG-001" />
              {errors.sku && <p className="text-xs text-red-500 mt-1">{errors.sku.message}</p>}
            </div>
            <div>
              <label className="label">Barcode</label>
              <input {...register('barcode')} className="input" placeholder="8901058..." />
            </div>
          </div>

          <div>
            <label className="label">Category</label>
            <select {...register('category_id')} className="input">
              <option value="">Uncategorized</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Purchase Price (₹)</label>
              <input {...register('purchase_price')} type="number" step="0.01" className="input" />
              {errors.purchase_price && <p className="text-xs text-red-500 mt-1">{errors.purchase_price.message}</p>}
            </div>
            <div>
              <label className="label">Selling Price (₹)</label>
              <input {...register('selling_price')} type="number" step="0.01" className="input" />
              {errors.selling_price && <p className="text-xs text-red-500 mt-1">{errors.selling_price.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">
                Initial Quantity {product && <span className="text-gray-400">(use Stock In/Out to change)</span>}
              </label>
              <input {...register('quantity')} type="number" className="input" disabled={!!product} />
              {errors.quantity && <p className="text-xs text-red-500 mt-1">{errors.quantity.message}</p>}
            </div>
            <div>
              <label className="label">Minimum Stock</label>
              <input {...register('min_stock')} type="number" className="input" />
              {errors.min_stock && <p className="text-xs text-red-500 mt-1">{errors.min_stock.message}</p>}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" className="btn-primary flex-1 justify-center" disabled={isLoading}>
              {isLoading ? 'Saving...' : product ? 'Update Product' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
