'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard, Package, ArrowDownToLine, ArrowUpFromLine,
  ClipboardList, Users, Truck, BarChart2, FileText,
  Bell, Settings, LogOut, Store, Menu, X, ChevronDown, Moon, Sun
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import { useNotifications, useMarkNotificationsRead } from '@/hooks/useApi';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useQueryClient } from '@tanstack/react-query';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/inventory', icon: Package, label: 'Inventory' },
  { href: '/stock/in', icon: ArrowDownToLine, label: 'Stock In' },
  { href: '/stock/out', icon: ArrowUpFromLine, label: 'Stock Out' },
  { href: '/transactions', icon: ClipboardList, label: 'Transactions' },
  { href: '/suppliers', icon: Truck, label: 'Suppliers' },
  { href: '/audit', icon: FileText, label: 'Audit' },
  { href: '/analytics', icon: BarChart2, label: 'Analytics' },
  { href: '/notes', icon: FileText, label: 'Notes' },
];

const ownerNavItems = [
  { href: '/users', icon: Users, label: 'Users' },
  { href: '/activity', icon: ClipboardList, label: 'Activity Logs' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout, isAuthenticated } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const qc = useQueryClient();

  const { data: notifications = [] } = useNotifications(true);
  const { mutate: markRead } = useMarkNotificationsRead();

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

  useEffect(() => {
    if (!isAuthenticated) router.push('/auth/login');
  }, [isAuthenticated, router]);

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

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-100 dark:border-slate-700">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0">
          <Store className="w-4 h-4 text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">StoreIMS</p>
          <p className="text-xs text-gray-500 dark:text-slate-400 truncate">{user.name}</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className={isActive(href) ? 'sidebar-link-active' : 'sidebar-link'}
            onClick={() => setSidebarOpen(false)}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {label}
          </Link>
        ))}

        {user.role === 'owner' && (
          <>
            <div className="pt-3 pb-1 px-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-slate-500">Owner</p>
            </div>
            {ownerNavItems.map(({ href, icon: Icon, label }) => (
              <Link
                key={href}
                href={href}
                className={isActive(href) ? 'sidebar-link-active' : 'sidebar-link'}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
              </Link>
            ))}
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-gray-100 dark:border-slate-700 space-y-1">
        <Link href="/settings" className="sidebar-link">
          <Settings className="w-4 h-4" />
          Settings
        </Link>
        <button onClick={handleLogout} className="sidebar-link w-full text-left text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-slate-900 overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-60 bg-white dark:bg-slate-800 border-r border-gray-100 dark:border-slate-700 flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-60 h-full bg-white dark:bg-slate-800">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="flex items-center justify-between h-14 px-4 bg-white dark:bg-slate-800 border-b border-gray-100 dark:border-slate-700 flex-shrink-0">
          <button
            className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 ml-auto">
            <button
              className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700"
              onClick={() => markRead()}
            >
              <Bell className="w-5 h-5 text-gray-500 dark:text-slate-400" />
              {notifications.length > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                  {notifications.length > 9 ? '9+' : notifications.length}
                </span>
              )}
            </button>

            <button
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700"
              onClick={() => setDark(!dark)}
            >
              {dark ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-gray-500" />}
            </button>

            <div className="flex items-center gap-2 pl-2 border-l border-gray-200 dark:border-slate-600">
              <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</p>
                <p className="text-xs text-gray-500 dark:text-slate-400 capitalize">{user.role}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
