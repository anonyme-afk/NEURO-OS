import { Link, useLocation } from 'react-router-dom';
import { Activity, Settings, PackageOpen, Download, Beaker, Sun, Moon } from 'lucide-react';

interface SidebarProps {
  theme: string;
  onToggleTheme: () => void;
}

export function Sidebar({ theme, onToggleTheme }: SidebarProps) {
  const location = useLocation();

  const links = [
    { name: 'Core Dashboard', path: '/dashboard', icon: <Activity className="w-5 h-5" /> },
    { name: 'Marketplace', path: '/marketplace', icon: <Download className="w-5 h-5" /> },
    { name: 'Workspaces', path: '/workspaces', icon: <PackageOpen className="w-5 h-5" /> },
    { name: 'Vault & Settings', path: '/settings', icon: <Settings className="w-5 h-5" /> },
    { name: 'Chaos Lab', path: '/lab', icon: <Beaker className="w-5 h-5" /> }
  ];

  return (
    <div className="w-64 bg-[var(--color-surface)] min-h-screen border-r border-[var(--color-border)] p-4 flex flex-col gap-6 transition-colors duration-300">
      <div className="flex items-center gap-3 px-2 py-4">
        <div className="w-8 h-8 rounded bg-[var(--color-primary)]/10 flex items-center justify-center border border-[var(--color-primary)]/30">
          <Activity className="text-[var(--color-primary)] w-5 h-5" />
        </div>
        <span className="text-xl font-bold tracking-wider glow-text">NEURO-OS</span>
      </div>

      <nav className="flex flex-col gap-1">
        {links.map(l => {
          const isActive = location.pathname.startsWith(l.path);
          return (
            <Link 
              key={l.path} 
              to={l.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-sm font-medium ${
                isActive 
                ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/10' 
                : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]'
              }`}
            >
              {l.icon}
              {l.name}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-4">
        <button 
          onClick={onToggleTheme}
          className="flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-sm font-medium text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
        </button>

        <div className="p-4 rounded-xl bg-[var(--color-surface-2)]/50 border border-[var(--color-border)] text-[10px] uppercase tracking-widest flex flex-col gap-2">
          <div className="flex justify-between items-center text-[var(--color-text-muted)]">
            <span>Security</span>
            <span className="text-[var(--color-success)] font-bold">MAX</span>
          </div>
          <div className="flex justify-between items-center text-[var(--color-text-muted)]">
            <span>Vault</span>
            <span className="text-[var(--color-success)] font-bold">LOCKED</span>
          </div>
        </div>
      </div>
    </div>
  );
}
