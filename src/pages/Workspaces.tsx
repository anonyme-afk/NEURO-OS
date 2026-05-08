import { useState } from 'react';
import { LayoutDashboard, KeyRound, ShieldCheck, Users } from 'lucide-react';
import { apiFetch } from '../lib/api';
import { PageHeader } from '../components/ui/PageHeader';
import { GlassPanel } from '../components/ui/GlassPanel';

export function Workspaces() {
  const [activeWorkspace, setActiveWorkspace] = useState('Personal');
  const [newKey, setNewKey] = useState('');
  const [provider, setProvider] = useState('openai');

  const addKeyToVault = async () => {
    if (!newKey) return;
    try {
      await apiFetch('/vault/keys', {
        method: 'POST',
        body: { provider, apiKey: newKey, workspaceId: activeWorkspace }
      });
      setNewKey('');
      alert('Clé chiffrée et sauvegardée avec succès !');
    } catch (e) {
      alert('Error saving key');
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto flex flex-col gap-6 flex-1">
      <PageHeader 
        icon={<Users className="text-[#6E00FF]" />} 
        title="Multi-Tenant Workspaces" 
        description='Isolate contexts, data, and "Bring Your Own API" (BYOK) per user or team.' 
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassPanel className="flex flex-col gap-4">
          <h2 className="text-xl font-bold font-mono text-[#00FFFF] flex items-center gap-2">
             <LayoutDashboard className="w-5 h-5" /> Select Workspace
          </h2>
          <div className="flex flex-col gap-2">
             {['Personal (Local)', 'Enterprise Squad', 'Research Lab Sandbox'].map(w => (
                 <button 
                   key={w}
                   onClick={() => setActiveWorkspace(w)}
                   className={`p-4 text-left font-mono rounded border flex items-center justify-between transition-colors ${activeWorkspace === w ? 'bg-[#6E00FF]/20 border-[#6E00FF] text-[#00FFFF]' : 'bg-black/20 border-white/10 text-white/70 hover:border-white/30'}`}
                 >
                     <span>{w}</span>
                     {activeWorkspace === w && <ShieldCheck className="text-[#00FF88]" />}
                 </button>
             ))}
          </div>
        </GlassPanel>

        <GlassPanel className="flex flex-col gap-4 bg-[#050D1A] border-[#FF006E]/30 relative overflow-hidden">
           <div className="absolute top-0 right-0 p-2 bg-[#FF006E]/20 text-[#FF006E] font-bold text-[10px] uppercase rounded-bl-lg">FBI Level Security</div>
           <h2 className="text-xl font-bold font-mono text-[#FF006E] flex items-center gap-2">
             <KeyRound className="w-5 h-5" /> Bring Your Own API (Vault)
           </h2>
           <p className="text-sm text-[#6B7A99]">Inject external LLM capabilities into "{activeWorkspace}". Keys are AES-256 encrypted at rest.</p>
           
           <div className="mt-4 flex flex-col gap-4">
               <div>
                  <label className="text-xs text-[#6B7A99] font-mono">Provider</label>
                  <select 
                    value={provider} 
                    onChange={e => setProvider(e.target.value)} 
                    className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-white font-mono mt-1"
                  >
                     <option value="openai">OpenAI (GPT-4o)</option>
                     <option value="anthropic">Anthropic (Claude 3.5)</option>
                     <option value="groq">Groq (Llama 3)</option>
                  </select>
               </div>
               <div>
                  <label className="text-xs text-[#6B7A99] font-mono">API Key (Stored in Vault)</label>
                  <input 
                    type="password"
                    value={newKey}
                    onChange={(e) => setNewKey(e.target.value)}
                    placeholder="sk-..."
                    className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-white font-mono mt-1 focus:border-[#FF006E] outline-none"
                  />
               </div>
               <button 
                  onClick={addKeyToVault}
                  className="mt-2 w-full py-3 bg-[#FF006E]/10 border border-[#FF006E]/50 text-[#FF006E] rounded font-bold hover:bg-[#FF006E]/30 transition-colors"
                >
                   ENCRYPT & STORE KEY
               </button>
           </div>
        </GlassPanel>
      </div>
    </div>
  );
}
