'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Plus, X } from 'lucide-react';
import { useUsers, useCreateUser, useUpdateUser } from '@/hooks/useApi';

const schema = z.object({
  name: z.string().min(1, 'Required'),
  email: z.string().email('Invalid email'),
  password: z.string()
    .min(8, 'At least 8 characters')
    .regex(/[A-Z]/, 'Needs uppercase')
    .regex(/[a-z]/, 'Needs lowercase')
    .regex(/\d/, 'Needs digit')
    .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Needs special character'),
  role: z.enum(['owner', 'employee']),
});
type FormData = z.infer<typeof schema>;

function CreateUserModal({ onClose }: { onClose: () => void }) {
  const createMutation = useCreateUser();
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'employee' },
  });

  const onSubmit = async (data: FormData) => {
    try {
      await createMutation.mutateAsync(data);
      toast.success('User created');
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="card w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Add User</h2>
          <button onClick={onClose}><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">Name</label>
            <input {...register('name')} className="input" />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className="label">Email</label>
            <input {...register('email')} type="email" className="input" />
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <label className="label">Password</label>
            <input {...register('password')} type="password" className="input" />
            {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
          </div>
          <div>
            <label className="label">Role</label>
            <select {...register('role')} className="input">
              <option value="employee">Employee</option>
              <option value="owner">Owner</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" className="btn-primary flex-1 justify-center" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function UsersPage() {
  const [showModal, setShowModal] = useState(false);
  const { data, isLoading } = useUsers({});

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Users</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400">Manage staff access and roles</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary"><Plus className="w-4 h-4" /> Add User</button>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-slate-700/50">
            <tr>
              <th className="table-header">Name</th>
              <th className="table-header">Email</th>
              <th className="table-header">Role</th>
              <th className="table-header">Status</th>
              <th className="table-header">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
            {isLoading && <tr><td colSpan={5} className="table-cell text-center py-8 text-gray-400">Loading...</td></tr>}
            {data?.items?.map((u: any) => (
              <tr key={u.id}>
                <td className="table-cell font-medium">{u.name}</td>
                <td className="table-cell text-gray-500 dark:text-slate-400">{u.email}</td>
                <td className="table-cell capitalize">
                  <span className={u.role === 'owner' ? 'badge-blue' : 'badge-green'}>{u.role}</span>
                </td>
                <td className="table-cell">
                  {u.is_active ? <span className="badge-green">Active</span> : <span className="badge-red">Disabled</span>}
                </td>
                <td className="table-cell text-gray-500 dark:text-slate-400 text-xs">{new Date(u.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && <CreateUserModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
