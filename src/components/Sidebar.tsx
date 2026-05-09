import { Link, useLocation } from 'react-router-dom';
import { Activity, Settings, PackageOpen, Download, Beaker, Sun, Moon, Brain, Zap } from 'lucide-react';

interface SidebarProps {
  theme: string;
  onToggleTheme: () => void;
}

export function Sidebar({ theme, onToggleTheme }: SidebarProps) {
  const location = useLocation();

  const links = [
    { name: 'Dashboard', path: '/dashboard', icon: Activity, desc: 'Vue temps réel' },
    { name: 'Marketplace', path: '/marketplace', icon: Download, desc: 'Modules' },
    { name: 'Workspaces', path: '/workspaces', icon: PackageOpen, desc: 'API Keys' },
    { name: 'Vault & Sécurité', path: '/settings', icon: Settings, desc: 'Config' },
    { name: 'Chaos Lab', path: '/lab', icon: Beaker, desc: 'Tests' },
  ];

  return (
    <aside className="w-60 shrink-0 bg-[var(--color-surface)] border-r border-[var(--color-border)] flex flex-col min-h-screen transition-colors duration-300">

      {/* Logo */}
      <div className="px-5 py-6 border-b border-[var(--color-border)]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[var(--color-primary-dim)] border border-[rgba(0,255,255,0.2)] flex items-center justify-center">
            <Brain className="w-5 h-5 text-[var(--color-primary)]" />
          </div>
          <div>
            <div className="text-[15px] font-bold tracking-wide gradient-text">NEURO-OS</div>
            <div className="text-[10px] text-[var(--color-text-muted)] font-mono uppercase tracking-wider">v2.0 · GPL-3</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 flex flex-col gap-1">
        <div className="label px-2 mb-2 mt-1">Navigation</div>
        {links.map(({ name, path, icon: Icon, desc }) => {
          const active = location.pathname.startsWith(path);
          return (
            <Link key={path} to={path} className={`nav-item ${active ? 'active' : ''}`}>
              <Icon className="w-4 h-4 shrink-0" />
              <div className="flex flex-col min-w-0">
                <span className="text-[13px] font-medium leading-tight">{name}</span>
                <span className="text-[10px] opacity-50 leading-tight">{desc}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="p-3 border-t border-[var(--color-border)] flex flex-col gap-2">
        {/* System status */}
        <div className="card p-3 !border-[var(--color-border)]">
          <div className="flex items-center justify-between mb-2">
            <span className="label text-[9px]">System</span>
            <div className="flex items-center gap-1.5">
              <div className="pulse-dot w-1.5 h-1.5"></div>
              <span className="text-[10px] text-[var(--color-success)] font-mono font-bold">ONLINE</span>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            {[
              { label: 'Security', value: 'MAX', color: 'var(--color-success)' },
              { label: 'Vault', value: 'LOCKED', color: 'var(--color-success)' },
              { label: 'ZTA Mode', value: 'ON', color: 'var(--color-primary)' },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex justify-between items-center">
                <span className="text-[10px] text-[var(--color-text-muted)]">{label}</span>
                <span className="text-[10px] font-bold font-mono" style={{ color }}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Theme toggle */}
        <button onClick={onToggleTheme} className="btn btn-ghost w-full justify-start text-[12px] py-2">
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
        </button>
      </div>
    </aside>
  );
}