'use client';
import { Bell, Moon, Sun, Menu, Search, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useNotifications, useMarkNotificationsRead } from '@/hooks/useApi';

const pageTitles: Record<string, string> = {
  '/dashboard':    'Dashboard',
  '/inventory':    'Products',
  '/stock/in':     'Stock In',
  '/stock/out':    'Stock Out',
  '/transactions': 'Transactions',
  '/suppliers':    'Suppliers',
  '/audit':        'Stock Audit',
  '/analytics':    'Analytics',
  '/notes':        'Notes',
  '/users':        'Team',
  '/activity':     'Activity Logs',
  '/settings':     'Settings',
};

interface TopNavbarProps {
  dark: boolean;
  onToggleDark: () => void;
  onOpenSidebar: () => void;
}

export default function TopNavbar({ dark, onToggleDark, onOpenSidebar }: TopNavbarProps) {
  const { user } = useAuthStore();
  const pathname = usePathname();
  const [showNotifications, setShowNotifications] = useState(false);
  const { data: notifications = [] } = useNotifications(true);
  const { mutate: markRead } = useMarkNotificationsRead();

  const title = Object.entries(pageTitles).find(([key]) =>
    pathname === key || pathname.startsWith(key + '/')
  )?.[1] ?? 'StoreIMS';

  return (
    <header className="topbar-glass flex items-center h-14 px-4 gap-3 flex-shrink-0 sticky top-0 z-30">
      {/* Hamburger — mobile */}
      <button className="btn-icon lg:hidden" onClick={onOpenSidebar}>
        <Menu className="w-5 h-5" />
      </button>

      {/* Page title */}
      <h1 className="text-[15px] font-semibold text-[var(--text-primary)] tracking-tight hidden sm:block">
        {title}
      </h1>

      {/* Search — desktop */}
      <div className="hidden md:flex items-center gap-2 ml-4 flex-1 max-w-xs">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-secondary)]" />
          <input
            placeholder="Search products…"
            className="input pl-8 py-1.5 text-xs h-8 rounded-lg"
          />
        </div>
      </div>

      {/* Right controls */}
      <div className="ml-auto flex items-center gap-1">

        {/* Dark/light toggle */}
        <button
          className="btn-icon relative"
          onClick={onToggleDark}
          aria-label="Toggle theme"
        >
          <span className={`transition-all duration-300 ${dark ? 'opacity-100 scale-100' : 'opacity-0 scale-50 absolute'}`}>
            <Sun className="w-4 h-4 text-amber-400" />
          </span>
          <span className={`transition-all duration-300 ${!dark ? 'opacity-100 scale-100' : 'opacity-0 scale-50 absolute'}`}>
            <Moon className="w-4 h-4" />
          </span>
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            className="btn-icon"
            onClick={() => { setShowNotifications(!showNotifications); markRead(); }}
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {notifications.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-[#080d1a]" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-72 card shadow-xl overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-[var(--border)]">
                <p className="text-sm font-semibold">Notifications</p>
              </div>
              {notifications.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-[var(--text-secondary)]">
                  All caught up ✓
                </div>
              ) : (
                <div className="max-h-64 overflow-y-auto divide-y divide-[var(--border)]">
                  {notifications.map((n: any) => (
                    <div key={n.id} className="px-4 py-3 text-sm text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/5">
                      {n.message}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="w-px h-5 bg-[var(--border)] mx-1" />

        {/* User */}
        <button className="flex items-center gap-2 rounded-xl px-2.5 py-1.5 hover:bg-black/5 dark:hover:bg-white/5 transition-all">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center shadow-sm">
            <span className="text-xs font-bold text-white">
              {user?.name?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-semibold text-[var(--text-primary)] leading-tight">{user?.name}</p>
            <p className="text-[10px] text-[var(--text-secondary)] capitalize leading-tight">{user?.role}</p>
          </div>
          <ChevronDown className="w-3 h-3 text-[var(--text-secondary)] hidden sm:block" />
        </button>
      </div>
    </header>
  );
}