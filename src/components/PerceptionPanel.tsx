import React, { useState, useRef } from 'react';
import { Upload, Eye, FileText, Loader2, CheckCircle2 } from 'lucide-react';
import { API_BASE } from '../lib/api';
import { GlassPanel } from './ui/GlassPanel';

export function PerceptionPanel() {
  const [mode, setMode] = useState<'image' | 'document'>('image');
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) return;

    setLoading(true);
    setResult('');
    setError('');

    const formData = new FormData();
    formData.append(mode === 'image' ? 'image' : 'file', file);
    if (prompt) formData.append('prompt', prompt);

    const token = localStorage.getItem('neuro_token');
    const endpoint = mode === 'image'
      ? `${API_BASE}/perception/analyze-image`
      : `${API_BASE}/memory/ingest-file`;

    try {
      const r = await fetch(endpoint, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData
      });

      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Erreur réseau');

      setResult(mode === 'image' ? data.description : data.message);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <GlassPanel className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Eye className="w-5 h-5 text-[#00FFFF]" />
        <h2 className="font-bold text-[#00FFFF] font-mono uppercase tracking-widest text-sm">
          Perception Module
        </h2>
      </div>

      <div className="flex gap-2">
        {(['image', 'document'] as const).map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-3 py-1 rounded text-xs font-mono uppercase transition-colors ${
              mode === m
                ? 'bg-[#00FFFF]/20 text-[#00FFFF] border border-[#00FFFF]/30'
                : 'text-[#6B7A99] hover:text-white'
            }`}
          >
            {m === 'image' ? '📷 Image' : '📄 Document'}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          ref={fileRef}
          type="file"
          accept={mode === 'image' ? 'image/jpeg,image/png,image/webp' : 'application/pdf,text/plain'}
          className="text-xs text-[#6B7A99] file:mr-3 file:py-1 file:px-3 file:rounded file:border file:border-white/10 file:bg-black/20 file:text-xs file:font-mono file:text-white cursor-pointer"
          required
        />

        {mode === 'image' && (
          <input
            type="text"
            placeholder="Question sur l'image (optionnel)"
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            className="bg-black/20 border border-white/10 rounded px-3 py-2 text-sm outline-none focus:border-[#00FFFF] text-white transition-colors"
          />
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex items-center justify-center gap-2 py-2 bg-[#00FFFF]/10 border border-[#00FFFF]/30 text-[#00FFFF] rounded font-mono text-sm hover:bg-[#00FFFF]/20 disabled:opacity-50 transition-colors"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          {loading ? 'Analyse en cours...' : mode === 'image' ? 'Analyser' : 'Ingérer dans la mémoire'}
        </button>
      </form>

      {error && (
        <div className="p-3 bg-[#FF3838]/10 border border-[#FF3838]/20 rounded text-xs text-[#FF3838] font-mono">
          {error}
        </div>
      )}

      {result && (
        <div className="p-4 bg-black/20 border border-white/10 rounded text-sm text-white leading-relaxed">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-3 h-3 text-[#00FF88]" />
            <span className="text-[10px] font-mono uppercase text-[#6B7A99]">
              {mode === 'image' ? 'Analyse Vision' : 'Ingestion réussie'}
            </span>
          </div>
          {result}
        </div>
      )}
    </GlassPanel>
  );
}
