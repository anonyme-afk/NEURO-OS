import { MetricsDashboard } from '../components/MetricsDashboard';
import { TerminalInterface } from '../components/TerminalInterface';
import { Brain3D } from '../components/Brain3D';
import { PerceptionPanel } from '../components/PerceptionPanel';
import { PageHeader } from '../components/ui/PageHeader';
import { GlassPanel } from '../components/ui/GlassPanel';
import { Cpu } from 'lucide-react';

export function Dashboard() {
  return (
    <div className="flex flex-col h-full w-full max-w-7xl mx-auto gap-8">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-[var(--color-text)]">Dashboard</h1>
          <p className="text-[var(--color-text-muted)] mt-2">Real-time cognitive infrastructure overview.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
          <span className="w-2 h-2 rounded-full bg-[var(--color-success)] animate-pulse"></span>
          <span className="text-xs font-semibold text-[var(--color-success)] uppercase tracking-wider">System Live</span>
        </div>
      </header>
      
      <MetricsDashboard />

      <PerceptionPanel />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[600px]">
        {/* 3D Visualizer */}
        <div className="openclaw-card overflow-hidden relative">
          <div className="absolute top-6 left-6 z-10 font-medium text-[10px] tracking-[0.2em] uppercase text-[var(--color-primary)] bg-[var(--color-bg)]/80 px-3 py-1.5 rounded-full border border-[var(--color-primary)]/20 backdrop-blur-md">
            Neural Topology Visualization
          </div>
          <Brain3D />
        </div>

        {/* Terminal Interface */}
        <div className="h-full">
          <TerminalInterface />
        </div>
      </div>
    </div>
  );
}
