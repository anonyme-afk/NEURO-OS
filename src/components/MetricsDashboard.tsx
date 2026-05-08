import { useEffect, useState } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line } from 'react-chartjs-2';
import { apiFetch } from '../lib/api';
import useSWR from 'swr';

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
        {[1,2,3,4].map(i => <div key={i} className="h-24 bg-[var(--color-surface-2)] rounded-xl"></div>)}
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
        <MetricCard title="CPU" value={`${metrics.system.cpu_percent}%`} color="var(--color-primary)" />
        <MetricCard title="Memory" value={`${metrics.system.ram_used_gb}GB`} subValue={`${metrics.system.ram_percent}%`} color="var(--color-secondary)" />
        <MetricCard title="Operations" value={metrics.brain.requests_last_minute} color="var(--color-success)" />
        <MetricCard title="Latency" value={`${metrics.brain.avg_latency_ms}ms`} color={metrics.brain.avg_latency_ms > 1000 ? 'var(--color-warning)' : 'var(--color-success)'} />
      </div>

      <div className="openclaw-card p-6 h-[240px]">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--color-text-muted)]">Real-time Performance</h3>
          <div className="flex gap-4 text-[10px] font-bold uppercase tracking-widest">
            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{backgroundColor: primaryColor}}></span> CPU</div>
            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{backgroundColor: secondaryColor}}></span> RAM</div>
          </div>
        </div>
        <div className="h-[140px]">
          <Line data={chartData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, subValue, color }: { title: string, value: string | number, subValue?: string, color: string }) {
  return (
    <div className="openclaw-card p-6 group">
      <p className="text-[10px] font-bold tracking-[0.1em] uppercase text-[var(--color-text-muted)] mb-3">{title}</p>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold tracking-tight text-[var(--color-text)] transition-all group-hover:scale-105 origin-left" style={{ color: value === 'ERR' ? 'var(--color-error)' : 'inherit' }}>
          {value}
        </span>
        {subValue && <span className="text-sm font-medium text-[var(--color-text-muted)]">{subValue}</span>}
      </div>
      <div className="mt-4 h-1 w-full bg-[var(--color-surface-2)] rounded-full overflow-hidden">
        <div className="h-full transition-all duration-500" style={{ backgroundColor: color, width: typeof value === 'string' && value.includes('%') ? value : '40%' }}></div>
      </div>
    </div>
  );
}
