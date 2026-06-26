'use client';

export default function Footer() {
  return (
    <footer
      className="flex items-center justify-between px-6 h-12 flex-shrink-0 text-xs font-medium select-none"
      style={{
        background: 'var(--sidebar-bg)',
        borderTop: '1px solid var(--sidebar-border)',
        color: 'var(--sidebar-text)',
      }}
    >
      {/* Left */}
      <span className="flex items-center gap-1.5">
        <span>©</span>
        <span>2026 StoreIMS</span>
        <span className="opacity-30 mx-1">•</span>
        <span className="hidden sm:inline opacity-70">Smart Inventory Management</span>
      </span>

      {/* Right */}
      <span className="hidden md:flex items-center gap-3 opacity-50">
        {['Inventory', 'Stock Control', 'Analytics', 'Audits'].map((item, i, arr) => (
          <span key={item} className="flex items-center gap-3">
            {item}
            {i < arr.length - 1 && <span className="opacity-40">•</span>}
          </span>
        ))}
      </span>
    </footer>
  );
}
