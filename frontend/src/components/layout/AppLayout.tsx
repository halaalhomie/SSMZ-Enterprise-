'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useQueryClient } from '@tanstack/react-query';
import Sidebar from './Sidebar';
import TopNavbar from './TopNavbar';
import Footer from './Footer';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, logout, isAuthenticated, isHydrated } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const qc = useQueryClient();

  useWebSocket({
    onStockUpdate: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onLowStockAlert: (data: any) => {
      toast.error(`Low stock: ${data.product_name} — only ${data.quantity} left`);
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
    onAuditComplete: (data: any) => {
      toast.success(`Audit complete: ${data.product_name} (diff: ${data.difference})`);
    },
    onNotification: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  useEffect(() => {

    if (!isHydrated) return;

    if (!isAuthenticated) {
      router.push('/auth/login');
    }

  }, [isAuthenticated, isHydrated, router]);

  useEffect(() => {
    if (dark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [dark]);

  if (!isHydrated) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated || !user) {
    router.push('/auth/login');
    return null;
  }

  const handleLogout = () => {
    logout();
    router.push('/auth/login');
    toast.success('Signed out');
  };

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: 'var(--bg)' }}
    >
      {/* ── Desktop sidebar ── */}
      <aside
        className="hidden lg:flex lg:flex-col w-60 flex-shrink-0"
        style={{ background: 'var(--sidebar-bg)' }}
      >
        <Sidebar onLogout={handleLogout} />
      </aside>

      {/* ── Mobile sidebar drawer ── */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <aside
            className="relative w-64 h-full flex flex-col"
            style={{ background: 'var(--sidebar-bg)' }}
          >
            <Sidebar
              onNavClick={() => setSidebarOpen(false)}
              onLogout={() => { setSidebarOpen(false); handleLogout(); }}
            />
          </aside>
        </div>
      )}

      {/* ── Main column (navbar + content + footer) ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top navbar */}
        <TopNavbar
          dark={dark}
          onToggleDark={() => setDark(d => !d)}
          onOpenSidebar={() => setSidebarOpen(true)}
        />

        {/* Scrollable page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 lg:p-6 min-h-full">
            {children}
          </div>
        </main>

        {/* Sticky footer */}
        <Footer />
      </div>
    </div>
  );
}
