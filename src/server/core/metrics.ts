import si from 'systeminformation';
import { eventBus } from './eventBus';

// Simple in-memory module log to track real brain activity latency
export const moduleLogs: {
  timestamp: number;
  latency_ms: number;
  error: boolean;
}[] = [];

export async function getLiveMetrics() {
  try {
    const [cpu, mem, networkStats] = await Promise.all([
      si.currentLoad(),
      si.mem(),
      si.networkStats()
    ]);

    // Calculate real latency of requests in the last minute
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    const recentLogs = moduleLogs.filter(log => log.timestamp > oneMinuteAgo);
    
    const avgLatency = recentLogs.length > 0 
      ? recentLogs.reduce((acc, log) => acc + log.latency_ms, 0) / recentLogs.length 
      : 0;

    const errors = recentLogs.filter(log => log.error).length;

    // Use total network IO across active interfaces
    let netSent = 0;
    let netRecv = 0;
    networkStats.forEach(net => {
      netSent += net.tx_bytes;
      netRecv += net.rx_bytes;
    });

    return {
      system: {
        cpu_percent: Math.round(cpu.currentLoad * 100) / 100,
        ram_percent: Math.round((mem.active / mem.total) * 10000) / 100,
        ram_used_gb: Math.round((mem.active / 1073741824) * 100) / 100,
        net_sent_mb: Math.round((netSent / 1048576) * 100) / 100,
        net_recv_mb: Math.round((netRecv / 1048576) * 100) / 100,
      },
      brain: {
        requests_last_minute: recentLogs.length,
        avg_latency_ms: Math.round(avgLatency * 10) / 10,
        errors_last_minute: errors,
      }
    };
  } catch (error) {
    console.error("[Metrics Error]", error);
    throw error;
  }
}
