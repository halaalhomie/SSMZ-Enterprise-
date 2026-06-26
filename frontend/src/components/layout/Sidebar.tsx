'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Package, ArrowDownToLine, ArrowUpFromLine,
  ClipboardList, Users, Truck, BarChart2, StickyNote,
  Settings, LogOut, ShieldCheck, Activity, Boxes,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

const navGroups = [
  {
    label: 'Overview',
    items: [
      { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', color: 'text-indigo-400' },
    ],
  },
  {
    label: 'Inventory',
    items: [
      { href: '/inventory',    icon: Package,          label: 'Products',      color: 'text-teal-400' },
      { href: '/stock/in',     icon: ArrowDownToLine,  label: 'Stock In',      color: 'text-emerald-400' },
      { href: '/stock/out',    icon: ArrowUpFromLine,  label: 'Stock Out',     color: 'text-amber-400' },
      { href: '/transactions', icon: ClipboardList,    label: 'Transactions',  color: 'text-sky-400' },
      { href: '/suppliers',    icon: Truck,            label: 'Suppliers',     color: 'text-violet-400' },
    ],
  },
  {
    label: 'Reports',
    items: [
      { href: '/audit',     icon: ShieldCheck, label: 'Audit',     color: 'text-rose-400' },
      { href: '/analytics', icon: BarChart2,   label: 'Analytics', color: 'text-purple-400' },
      { href: '/notes',     icon: StickyNote,  label: 'Notes',     color: 'text-yellow-400' },
    ],
  },
];

const ownerItems = [
  { href: '/users',    icon: Users,    label: 'Team',          color: 'text-pink-400' },
  { href: '/activity', icon: Activity, label: 'Activity Logs', color: 'text-orange-400' },
];

interface SidebarProps { onNavClick?: () => void; onLogout: () => void; }

export default function Sidebar({ onNavClick, onLogout }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <div
      className="flex flex-col h-full"
      style={{ background: 'var(--sidebar-bg)' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5" style={{ borderBottom: '1px solid var(--sidebar-border)' }}>
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 flex-shrink-0">
          <Boxes className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-[15px] font-bold text-white tracking-tight">StoreIMS</p>
          <p className="text-xs truncate" style={{ color: 'var(--sidebar-text)' }}>{user?.name}</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-5">
        {navGroups.map((group) => (
          <div key={group.label}>
            <p className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-widest"
               style={{ color: 'var(--sidebar-text)', opacity: 0.5 }}>
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map(({ href, icon: Icon, label, color }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={onNavClick}
                  className={isActive(href) ? 'sidebar-link-active' : 'sidebar-link'}
                >
                  <span className={`flex-shrink-0 ${isActive(href) ? color : ''}`}>
                    <Icon className="w-4 h-4" />
                  </span>
                  {label}
                </Link>
              ))}
            </div>
          </div>
        ))}

        {user?.role === 'owner' && (
          <div>
            <p className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-widest"
               style={{ color: 'var(--sidebar-text)', opacity: 0.5 }}>
              Admin
            </p>
            <div className="space-y-0.5">
              {ownerItems.map(({ href, icon: Icon, label, color }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={onNavClick}
                  className={isActive(href) ? 'sidebar-link-active' : 'sidebar-link'}
                >
                  <span className={`flex-shrink-0 ${isActive(href) ? color : ''}`}>
                    <Icon className="w-4 h-4" />
                  </span>
                  {label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className="px-3 pb-4 pt-3 space-y-0.5" style={{ borderTop: '1px solid var(--sidebar-border)' }}>
        <Link href="/settings" onClick={onNavClick}
          className={isActive('/settings') ? 'sidebar-link-active' : 'sidebar-link'}>
          <Settings className="w-4 h-4 flex-shrink-0" />
          Settings
        </Link>
        <button
          onClick={onLogout}
          className="sidebar-link w-full text-left hover:!text-red-400 hover:!bg-red-500/10"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          Sign out
        </button>
      </div>
    </div>
  );
}
