'use client';

import { useState } from 'react';
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  AlertTriangle,
  History,
  Download,
  Upload,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import {
  useProducts,
  useCategories,
  useDeleteProduct,
} from '@/hooks/useApi';
import { useAuthStore } from '@/store/authStore';
import ProductFormModal from '@/components/forms/ProductFormModal';
import { Product } from '@/types';

export default function InventoryPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [modalProduct, setModalProduct] = useState<
    Product | null | undefined
  >(undefined);

  const { user } = useAuthStore();

  const { data: categories = [] } = useCategories();

  const { data, isLoading } = useProducts({
    page,
    page_size: 15,
    search: search || undefined,
    category_id: categoryId || undefined,
    low_stock: lowStockOnly,
  });

  const deleteMutation = useDeleteProduct();

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;

    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Product deleted');
    } catch (err: any) {
      toast.error(
        err.response?.data?.detail || 'Failed to delete product'
      );
    }
  };

  const handleExport = async () => {
    try {
      const token = localStorage.getItem('access_token');

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/products/export`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error();
      }

      const blob = await response.blob();

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = 'inventory_export.xlsx';

      document.body.appendChild(link);
      link.click();

      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success('Inventory exported successfully');
    } catch (error) {
      toast.error('Failed to export inventory');
    }
  };

  const handleImport = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = localStorage.getItem('access_token');

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/products/import`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error();
      }

      toast.success('Inventory imported successfully');

      window.location.reload();
    } catch (error) {
      toast.error('Import failed');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Inventory
          </h1>

          <p className="text-sm text-gray-500 dark:text-slate-400">
            Manage your products and stock levels
          </p>
        </div>

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={handleExport}
            className="btn-secondary"
          >
            <Download className="w-4 h-4" />
            Export Excel
          </button>

          <label className="btn-secondary cursor-pointer">
            <Upload className="w-4 h-4" />
            Import Excel

            <input
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleImport}
            />
          </label>

          <button
            onClick={() => setModalProduct(null)}
            className="btn-primary"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </button>
        </div>
      </div>

      <div className="card p-3 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by name, SKU, or barcode..."
            className="input pl-9"
          />
        </div>

        <select
          value={categoryId}
          onChange={(e) => {
            setCategoryId(e.target.value);
            setPage(1);
          }}
          className="input sm:w-48"
        >
          <option value="">All Categories</option>

          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <label className="flex items-center gap-2 px-3 text-sm text-gray-700 dark:text-slate-300 cursor-pointer whitespace-nowrap">
          <input
            type="checkbox"
            checked={lowStockOnly}
            onChange={(e) => {
              setLowStockOnly(e.target.checked);
              setPage(1);
            }}
            className="rounded"
          />
          Low stock only
        </label>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-slate-700/50">
              <tr>
                <th className="table-header">Product</th>
                <th className="table-header">SKU / Barcode</th>
                <th className="table-header">Category</th>
                <th className="table-header text-right">Quantity</th>
                <th className="table-header text-right">Price</th>
                <th className="table-header">Status</th>
                <th className="table-header text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
              {isLoading && (
                <tr>
                  <td
                    colSpan={7}
                    className="table-cell text-center py-8 text-gray-400"
                  >
                    Loading...
                  </td>
                </tr>
              )}

              {!isLoading && data?.items.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="table-cell text-center py-8 text-gray-400"
                  >
                    No products found
                  </td>
                </tr>
              )}

              {data?.items.map((p) => (
                <tr
                  key={p.id}
                  className="hover:bg-gray-50 dark:hover:bg-slate-700/30"
                >
                  <td className="table-cell font-medium">
                    {p.name}
                  </td>

                  <td className="table-cell text-gray-500 dark:text-slate-400">
                    <div>{p.sku}</div>

                    {p.barcode && (
                      <div className="text-xs">
                        {p.barcode}
                      </div>
                    )}
                  </td>

                  <td className="table-cell">
                    {p.category?.name || (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>

                  <td className="table-cell text-right font-medium">
                    {p.quantity}
                  </td>

                  <td className="table-cell text-right">
                    ₹{Number(p.selling_price).toFixed(2)}
                  </td>

                  <td className="table-cell">
                    {p.quantity <= p.min_stock ? (
                      <span className="badge-red">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Low stock
                      </span>
                    ) : (
                      <span className="badge-green">
                        In stock
                      </span>
                    )}
                  </td>

                  <td className="table-cell text-right">
                    <div className="flex justify-end gap-1">
                      <Link
                        href={`/inventory/${p.id}`}
                        className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-slate-700"
                        title="History"
                      >
                        <History className="w-4 h-4 text-gray-500" />
                      </Link>

                      <button
                        onClick={() =>
                          setModalProduct(p as Product)
                        }
                        className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-slate-700"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4 text-gray-500" />
                      </button>

                      {user?.role === 'owner' && (
                        <button
                          onClick={() =>
                            handleDelete(p.id, p.name)
                          }
                          className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {data && data.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-slate-700">
            <p className="text-sm text-gray-500 dark:text-slate-400">
              Page {data.page} of {data.pages} ({data.total}{' '}
              products)
            </p>

            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="btn-secondary text-xs px-3 py-1.5"
              >
                Previous
              </button>

              <button
                disabled={page >= data.pages}
                onClick={() => setPage((p) => p + 1)}
                className="btn-secondary text-xs px-3 py-1.5"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {modalProduct !== undefined && (
        <ProductFormModal
          product={modalProduct}
          onClose={() =>
            setModalProduct(undefined)
          }
        />
      )}
    </div>
  );
}