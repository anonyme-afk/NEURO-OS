import React, { useEffect, useState } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line } from 'react-chartjs-2';
import { apiFetch } from '../lib/api';
import useSWR from 'swr';
import { Cpu, MemoryStick, Activity, Clock } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

interface MetricsData {
  system: {
    cpu_percent: number;
    ram_percent: number;
    ram_used_gb: number;
  };
  brain: {
    requests_last_minute: number;
    avg_latency_ms: number;
  };
}

export function useRealMetrics() {
  const { data: metrics } = useSWR<MetricsData>('/metrics/live', apiFetch, {
    refreshInterval: 2000,
    revalidateOnFocus: true,
    dedupingInterval: 1000
  });
  return metrics;
}

export function MetricsDashboard() {
  const metrics = useRealMetrics();
  const [history, setHistory] = useState<{ labels: string[], cpu: number[], ram: number[] }>({
    labels: [], cpu: [], ram: []
  });

  useEffect(() => {
    if (!metrics) return;
    setHistory(prev => {
      const now = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
      return {
        labels: [...prev.labels, now].slice(-30),
        cpu: [...prev.cpu, metrics.system.cpu_percent].slice(-30),
        ram: [...prev.ram, metrics.system.ram_percent].slice(-30)
      };
    });
  }, [metrics]);

  if (!metrics) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-pulse">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-[var(--color-surface-2)] rounded-xl"></div>)}
      </div>
    );
  }

  const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim() || '#00FFFF';
  const secondaryColor = getComputedStyle(document.documentElement).getPropertyValue('--color-secondary').trim() || '#8b5cf6';
  const textColor = getComputedStyle(document.documentElement).getPropertyValue('--color-text-muted').trim() || '#6B7A99';

  const chartData = {
    labels: history.labels,
    datasets: [
      {
        label: 'CPU (%)',
        data: history.cpu,
        borderColor: primaryColor,
        backgroundColor: `${primaryColor}20`,
        tension: 0.4,
        fill: true,
        pointRadius: 0,
      },
      {
        label: 'RAM (%)',
        data: history.ram,
        borderColor: secondaryColor,
        backgroundColor: `${secondaryColor}20`,
        tension: 0.4,
        fill: true,
        pointRadius: 0,
      }
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 0 },
    scales: {
      y: { min: 0, max: 100, grid: { color: 'rgba(128,128,128,0.1)' }, ticks: { color: textColor, font: { size: 10 } } },
      x: { grid: { display: false }, ticks: { display: false } }
    },
    plugins: {
      legend: { display: false },
      tooltip: { mode: 'index' as const, intersect: false }
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard title="CPU" value={`${metrics.system.cpu_percent}%`} color="var(--color-primary)" icon={<Cpu className="w-4 h-4" />} />
        <MetricCard title="Mémoire" value={`${metrics.system.ram_used_gb}GB`} subValue={`${metrics.system.ram_percent}%`} color="var(--color-secondary)" icon={<MemoryStick className="w-4 h-4" />} />
        <MetricCard title="Opérations/min" value={metrics.brain.requests_last_minute} color="var(--color-success)" icon={<Activity className="w-4 h-4" />} />
        <MetricCard title="Latence" value={`${metrics.brain.avg_latency_ms}ms`} color={metrics.brain.avg_latency_ms > 1000 ? 'var(--color-warning)' : 'var(--color-success)'} icon={<Clock className="w-4 h-4" />} />
      </div>

      <div className="openclaw-card p-6 h-[240px]">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--color-text-muted)]">Real-time Performance</h3>
          <div className="flex gap-4 text-[10px] font-bold uppercase tracking-widest">
            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: primaryColor }}></span> CPU</div>
            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: secondaryColor }}></span> RAM</div>
          </div>
        </div>
        <div className="h-[140px]">
          <Line data={chartData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, subValue, color, icon }: {
  title: string;
  value: string | number;
  subValue?: string;
  color: string;
  icon?: React.ReactNode;
}) {
  const numVal = typeof value === 'string' && value.includes('%')
    ? parseFloat(value)
    : null;

  return (
    <div className="stat-card group cursor-default">
      <div className="flex items-start justify-between mb-4">
        <span className="label">{title}</span>
        {icon && (
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: `${color}15`, color }}>
            {icon}
          </div>
        )}
      </div>
      <div className="flex items-baseline gap-2 mb-3">
        <span className="text-3xl font-bold tracking-tight transition-all group-hover:scale-105 origin-left"
          style={{ color: value === 'ERR' ? 'var(--color-error)' : 'var(--color-text)' }}>
          {value}
        </span>
        {subValue && (
          <span className="text-sm text-[var(--color-text-muted)]">{subValue}</span>
        )}
      </div>
      {numVal !== null && (
        <div className="h-1 w-full bg-[var(--color-surface-3)] rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-700"
            style={{ backgroundColor: color, width: `${Math.min(numVal, 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}
