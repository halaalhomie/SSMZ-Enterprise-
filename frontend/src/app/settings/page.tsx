'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Plus, Tag, Lock } from 'lucide-react';
import { useCategories, useCreateCategory } from '@/hooks/useApi';
import api from '@/lib/api';

const categorySchema = z.object({
  name: z.string().min(1, 'Required'),
  description: z.string().optional(),
});

const passwordSchema = z.object({
  current_password: z.string().min(1, 'Required'),
  new_password: z.string()
    .min(8, 'At least 8 characters')
    .regex(/[A-Z]/, 'Needs uppercase')
    .regex(/[a-z]/, 'Needs lowercase')
    .regex(/\d/, 'Needs digit')
    .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Needs special character'),
});

function CategorySection() {
  const { data: categories = [] } = useCategories();
  const createMutation = useCreateCategory();
  const { register, handleSubmit, reset, formState: { errors } } = useForm({ resolver: zodResolver(categorySchema) });

  const onSubmit = async (data: any) => {
    try {
      await createMutation.mutateAsync({ ...data, description: data.description || undefined });
      toast.success('Category added');
      reset();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed');
    }
  };

  return (
    <div className="card p-6">
      <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <Tag className="w-4 h-4" /> Categories
      </h2>

      <form onSubmit={handleSubmit(onSubmit)} className="flex gap-2 mb-4">
        <input {...register('name')} placeholder="New category name" className="input" />
        <button type="submit" className="btn-primary" disabled={createMutation.isPending}>
          <Plus className="w-4 h-4" /> Add
        </button>
      </form>
      {errors.name && <p className="text-xs text-red-500 mb-2">{errors.name.message as string}</p>}

      <div className="flex flex-wrap gap-2">
        {categories.map((c) => (
          <span key={c.id} className="badge-blue">{c.name}</span>
        ))}
        {categories.length === 0 && <p className="text-sm text-gray-400">No categories yet</p>}
      </div>
    </div>
  );
}

function PasswordSection() {
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm({ resolver: zodResolver(passwordSchema) });

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      await api.post('/auth/change-password', data);
      toast.success('Password changed successfully');
      reset();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-6 max-w-md">
      <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <Lock className="w-4 h-4" /> Change Password
      </h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="label">Current Password</label>
          <input {...register('current_password')} type="password" className="input" />
          {errors.current_password && <p className="text-xs text-red-500 mt-1">{errors.current_password.message as string}</p>}
        </div>
        <div>
          <label className="label">New Password</label>
          <input {...register('new_password')} type="password" className="input" />
          {errors.new_password && <p className="text-xs text-red-500 mt-1">{errors.new_password.message as string}</p>}
          <p className="text-xs text-gray-400 mt-1">8+ chars, uppercase, lowercase, digit, special character</p>
        </div>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Updating...' : 'Update Password'}
        </button>
      </form>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-sm text-gray-500 dark:text-slate-400">Manage categories, account, and preferences</p>
      </div>
      <CategorySection />
      <PasswordSection />
    </div>
  );
}
