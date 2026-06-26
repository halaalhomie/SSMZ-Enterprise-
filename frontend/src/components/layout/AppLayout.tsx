'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useQueryClient } from '@tanstack/react-query';
import Sidebar from './Sidebar';
import TopNavbar from './TopNavbar';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, logout, isAuthenticated } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const qc = useQueryClient();

  // Real-time sync
  useWebSocket({
    onStockUpdate: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onLowStockAlert: (data) => {
      toast.error(`Low stock: ${data.product_name} — only ${data.quantity} left`);
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
    onAuditComplete: (data) => {
      toast.success(`Audit complete: ${data.product_name} (diff: ${data.difference})`);
    },
    onNotification: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Redirect unauthenticated users
  useEffect(() => {
    if (!isAuthenticated) router.push('/auth/login');
  }, [isAuthenticated, router]);

  // Apply dark mode class
  useEffect(() => {
    if (dark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [dark]);

  if (!isAuthenticated || !user) return null;

  const handleLogout = () => {
    logout();
    router.push('/auth/login');
    toast.success('Logged out');
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-60 flex-shrink-0" style={{ background: 'var(--sidebar-bg)' }}>
        <Sidebar onLogout={handleLogout} />
      </aside>

      {/* Mobile sidebar drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-64 h-full" style={{ background: 'var(--sidebar-bg)' }}>
            <Sidebar
              onNavClick={() => setSidebarOpen(false)}
              onLogout={() => { setSidebarOpen(false); handleLogout(); }}
            />
          </aside>
        </div>
      )}

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopNavbar
          dark={dark}
          onToggleDark={() => setDark(!dark)}
          onOpenSidebar={() => setSidebarOpen(true)}
        />
        <main className="flex-1 overflow-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
