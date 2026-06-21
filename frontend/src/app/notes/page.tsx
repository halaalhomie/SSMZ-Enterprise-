'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Plus, Trash2, FileText, X } from 'lucide-react';
import { format } from 'date-fns';
import { useNotes, useCreateNote, useDeleteNote } from '@/hooks/useApi';

const schema = z.object({
  title: z.string().min(1, 'Required'),
  description: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

function NoteModal({ onClose }: { onClose: () => void }) {
  const createMutation = useCreateNote();
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      await createMutation.mutateAsync({ ...data, description: data.description || undefined });
      toast.success('Note added');
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="card w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">New Note</h2>
          <button onClick={onClose}><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">Title</label>
            <input {...register('title')} className="input" placeholder="e.g. Damaged stock from delivery" />
            {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
          </div>
          <div>
            <label className="label">Description</label>
            <textarea {...register('description')} className="input" rows={4} placeholder="Details..." />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" className="btn-primary flex-1 justify-center" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Saving...' : 'Add Note'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function NotesPage() {
  const [showModal, setShowModal] = useState(false);
  const { data: notes = [], isLoading } = useNotes();
  const deleteMutation = useDeleteNote();

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this note?')) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Note deleted');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Digital Notes</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400">Track damaged inventory, supplier reminders, pending payments</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary"><Plus className="w-4 h-4" /> New Note</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading && <p className="text-gray-400">Loading...</p>}
        {!isLoading && notes.length === 0 && (
          <div className="col-span-full text-center py-12">
            <FileText className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-400">No notes yet</p>
          </div>
        )}
        {notes.map((note) => (
          <div key={note.id} className="card p-4">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-gray-900 dark:text-white">{note.title}</h3>
              <button onClick={() => handleDelete(note.id)} className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20">
                <Trash2 className="w-4 h-4 text-red-500" />
              </button>
            </div>
            {note.description && <p className="text-sm text-gray-600 dark:text-slate-300 mb-2">{note.description}</p>}
            <p className="text-xs text-gray-400">
              {note.user?.name && `${note.user.name} · `}
              {format(new Date(note.created_at), 'dd MMM yyyy, HH:mm')}
            </p>
          </div>
        ))}
      </div>

      {showModal && <NoteModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
