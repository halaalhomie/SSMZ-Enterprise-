'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Pencil, Trash2, Phone, Mail, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSuppliers, useCreateSupplier, useUpdateSupplier, useDeleteSupplier } from '@/hooks/useApi';
import { useAuthStore } from '@/store/authStore';
import { Supplier } from '@/types';

const schema = z.object({
  name: z.string().min(1, 'Required'),
  phone: z.string().optional(),
  email: z.string().email('Invalid email').or(z.literal('')).optional(),
  address: z.string().optional(),
  gst_number: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

function SupplierModal({ supplier, onClose }: { supplier?: Supplier | null; onClose: () => void }) {
  const createMutation = useCreateSupplier();
  const updateMutation = useUpdateSupplier(supplier?.id || '');

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: supplier?.name || '',
      phone: supplier?.phone || '',
      email: supplier?.email || '',
      address: supplier?.address || '',
      gst_number: supplier?.gst_number || '',
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      const payload = { ...data, email: data.email || undefined };
      if (supplier) {
        await updateMutation.mutateAsync(payload);
        toast.success('Supplier updated');
      } else {
        await createMutation.mutateAsync(payload);
        toast.success('Supplier added');
      }
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed');
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="card w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{supplier ? 'Edit' : 'Add'} Supplier</h2>
          <button onClick={onClose}><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">Supplier Name</label>
            <input {...register('name')} className="input" />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Phone</label>
              <input {...register('phone')} className="input" />
            </div>
            <div>
              <label className="label">Email</label>
              <input {...register('email')} className="input" />
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
            </div>
          </div>
          <div>
            <label className="label">Address</label>
            <textarea {...register('address')} className="input" rows={2} />
          </div>
          <div>
            <label className="label">GST Number</label>
            <input {...register('gst_number')} className="input" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" className="btn-primary flex-1 justify-center" disabled={isLoading}>
              {isLoading ? 'Saving...' : supplier ? 'Update' : 'Add Supplier'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function SuppliersPage() {
  const [search, setSearch] = useState('');
  const [modalSupplier, setModalSupplier] = useState<Supplier | null | undefined>(undefined);
  const { data, isLoading } = useSuppliers({ search: search || undefined });
  const deleteMutation = useDeleteSupplier();
  const { user } = useAuthStore();

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete supplier "${name}"?`)) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Supplier deleted');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Suppliers</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400">Manage your supplier relationships</p>
        </div>
        <button onClick={() => setModalSupplier(null)} className="btn-primary"><Plus className="w-4 h-4" /> Add Supplier</button>
      </div>

      <div className="card p-3">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search suppliers..." className="input" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading && <p className="text-gray-400">Loading...</p>}
        {!isLoading && data?.items?.length === 0 && <p className="text-gray-400">No suppliers found</p>}
        {data?.items?.map((s: Supplier) => (
          <div key={s.id} className="card p-4">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-gray-900 dark:text-white">{s.name}</h3>
              <div className="flex gap-1">
                <button onClick={() => setModalSupplier(s)} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-slate-700">
                  <Pencil className="w-4 h-4 text-gray-500" />
                </button>
                {user?.role === 'owner' && (
                  <button onClick={() => handleDelete(s.id, s.name)} className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20">
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                )}
              </div>
            </div>
            {s.phone && <p className="text-sm text-gray-500 dark:text-slate-400 flex items-center gap-2"><Phone className="w-3.5 h-3.5" />{s.phone}</p>}
            {s.email && <p className="text-sm text-gray-500 dark:text-slate-400 flex items-center gap-2"><Mail className="w-3.5 h-3.5" />{s.email}</p>}
            {s.gst_number && <p className="text-xs text-gray-400 mt-2">GST: {s.gst_number}</p>}
          </div>
        ))}
      </div>

      {modalSupplier !== undefined && (
        <SupplierModal supplier={modalSupplier} onClose={() => setModalSupplier(undefined)} />
      )}
    </div>
  );
}
