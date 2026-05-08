import React, { useState, useRef, useEffect } from 'react';
import { Send, Cpu, ChevronRight, Activity, Terminal } from 'lucide-react';
import { useWebSocket } from '../hooks/useWebSocket';
import { apiFetch } from '../lib/api';

export function TerminalInterface() {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { events, isConnected } = useWebSocket();
  const [result, setResult] = useState<any>(null);
  const [showAudit, setShowAudit] = useState(false);
  
  const bottomRef = useRef<HTMLDivElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;

    setIsLoading(true);
    setResult(null);
    setShowAudit(false);
    try {
      const data = await apiFetch<any>('/brain/think', {
        method: 'POST',
        body: { prompt }
      });
      setResult(data);
    } catch (err: any) {
      setResult({ error: err.message });
    } finally {
      setIsLoading(false);
      setPrompt('');
    }
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [events]);

  return (
    <div className="flex flex-col h-full openclaw-card overflow-hidden transition-all duration-300">
      {/* Terminal Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)] bg-[var(--color-surface-2)]/30">
        <div className="flex items-center gap-3">
          <Terminal className="w-4 h-4 text-[var(--color-primary)]" />
          <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-[var(--color-text-muted)]">Core Execution Node</span>
        </div>
        <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-[var(--color-bg)]/50 border border-[var(--color-border)]">
          <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-[var(--color-success)] shadow-[0_0_8px_var(--color-success)]' : 'bg-[var(--color-error)]'}`} />
          <span className="text-[9px] font-bold text-[var(--color-text-muted)] uppercase">{isConnected ? 'WS Linked' : 'Offline'}</span>
        </div>
      </div>

      {/* Events Stream */}
      <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-2 font-mono text-[11px] bg-[var(--color-bg)]/20">
        {events.length === 0 && <div className="text-[var(--color-text-muted)] opacity-30 italic">Awaiting system events...</div>}
        {events.slice(-50).map((ev, i) => (
          <div key={i} className="flex gap-4 group">
            <span className="text-[var(--color-text-muted)] opacity-50">[{new Date(ev.timestamp).toLocaleTimeString()}]</span>
            <span className="text-[var(--color-primary)] font-bold min-w-[120px] uppercase">{ev.type}</span>
            <span className="text-[var(--color-text)] opacity-70 truncate group-hover:whitespace-normal group-hover:overflow-visible group-hover:z-10 transition-all">{JSON.stringify(ev.data)}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Thinking Result */}
      {result && (
        <div className="border-t border-[var(--color-border)] bg-[var(--color-surface)] p-6 space-y-4 animate-in slide-in-from-bottom-4 duration-300">
          {result.error ? (
            <div className="flex items-center gap-3 p-4 bg-[var(--color-error)]/10 border border-[var(--color-error)]/20 rounded-lg text-[var(--color-error)] font-bold text-xs">
              <Activity className="w-4 h-4" />
              <span>FAULT DETECTED: {result.error}</span>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-4 items-center">
                <div className="px-3 py-1 bg-[var(--color-primary)]/10 rounded-full text-[10px] font-bold text-[var(--color-primary)] uppercase">
                  {result.model_used}
                </div>
                <div className="text-[10px] font-medium text-[var(--color-text-muted)] uppercase tracking-wider flex gap-4">
                  <span>Lat: {result.total_latency_ms || result.latency_ms}ms</span>
                  <span>Conf: {(result.confidence * 100).toFixed(1)}%</span>
                </div>
                {result.all_responses && result.all_responses.length > 1 && (
                  <button 
                    onClick={() => setShowAudit(!showAudit)} 
                    className="ml-auto text-[10px] font-bold uppercase tracking-widest text-[var(--color-primary)] hover:underline"
                  >
                    {showAudit ? 'Collapse Audit' : 'Expand Trace'}
                  </button>
                )}
              </div>
              
              {showAudit && (
                 <div className="space-y-2 p-4 bg-[var(--color-bg)]/50 rounded-xl border border-[var(--color-border)]">
                   {result.all_responses.map((r: any, i: number) => (
                      <div key={i} className={`flex items-center justify-between text-[10px] p-2 rounded-md ${r.model === result.model_used ? 'bg-[var(--color-primary)]/5 border border-[var(--color-primary)]/20' : ''}`}>
                        <div className="flex gap-3">
                          <span className={r.model === result.model_used ? 'text-[var(--color-primary)] font-bold' : 'text-[var(--color-text-muted)]'}>{r.model}</span>
                          <span className="opacity-50 truncate max-w-[200px]">{r.text}</span>
                        </div>
                        <span className="text-[var(--color-text-muted)]">{r.latency_ms}ms</span>
                      </div>
                   ))}
                 </div>
              )}

              <div className="text-sm leading-relaxed text-[var(--color-text)] whitespace-pre-wrap font-sans bg-[var(--color-surface-2)]/50 p-4 rounded-xl border border-[var(--color-border)]">
                {result.response}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Input Field */}
      <form onSubmit={handleSubmit} className="p-4 bg-[var(--color-surface)] border-t border-[var(--color-border)]">
        <div className="relative group">
          <div className="absolute left-4 top-1/2 -translate-y-1/2">
            {isLoading ? <Cpu className="w-4 h-4 text-[var(--color-primary)] animate-spin" /> : <ChevronRight className="w-4 h-4 text-[var(--color-text-muted)]" />}
          </div>
          <input 
            type="text" 
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Execute thought protocol..." 
            className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl py-3 pl-12 pr-12 text-sm outline-none focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary)]/5 transition-all placeholder:text-[var(--color-text-muted)]/50"
            disabled={isLoading}
          />
          <button 
            type="submit" 
            disabled={isLoading || !prompt.trim()}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-[var(--color-text-muted)] hover:text-[var(--color-primary)] disabled:opacity-30 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
