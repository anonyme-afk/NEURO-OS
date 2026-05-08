import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Network, Server, ArrowRight, CheckCircle2 } from 'lucide-react';
import { apiFetch } from '../lib/api';
import { GlassPanel } from '../components/ui/GlassPanel';

export function SetupWizard() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [ollamaUrl, setOllamaUrl] = useState('http://localhost:11434');
  const [testResult, setTestResult] = useState<'idle'|'testing'|'success'|'error'>('idle');

  const handleTestOllama = async () => {
    setTestResult('testing');
    try {
      const data = await apiFetch<any>('/connectors/test', {
        method: 'POST',
        body: { provider: 'ollama_local', url: ollamaUrl, model: 'llama3' }
      });
      if (data.success) {
        setTestResult('success');
      } else {
        setTestResult('error');
      }
    } catch {
      setTestResult('error');
    }
  };

  const handleFinish = () => {
    navigate('/dashboard');
  };

  return (
    <div className="flex-1 flex items-center justify-center min-h-screen bg-[#020408] p-4 relative z-50">
      <GlassPanel className="max-w-2xl w-full border border-white/10 flex flex-col gap-8 shadow-2xl relative bg-[#050D1A]">
        <div className="flex gap-4 items-center">
           <div className="w-12 h-12 bg-[#00FFFF]/10 rounded border border-[#00FFFF]/30 flex items-center justify-center">
             <Server className="text-[#00FFFF] w-6 h-6" />
           </div>
           <div>
             <h1 className="text-2xl font-bold font-mono text-white glow-text">Initialization Protocol</h1>
             <p className="text-[#6B7A99] text-sm">NEURO-OS First Boot Setup</p>
           </div>
        </div>

        {step === 1 && (
          <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-4">
            <p className="text-white/80">
              Welcome to NEURO-OS. To finalize your decentralized brain platform, we must bind at least one cognitive connector to the fusion engine.
            </p>
            
            <GlassPanel className="p-5 border border-white/5 flex flex-col gap-4 !bg-transparent">
               <h2 className="text-[#00FFFF] font-mono font-bold flex items-center gap-2">
                 <Network className="w-4 h-4" /> Node 1: Local Ollama Hook
               </h2>
               <p className="text-xs text-[#6B7A99]">Enter the network URL where your local Ollama instance is broadcasting.</p>
               
               <div className="flex gap-2">
                 <input 
                   type="text" 
                   value={ollamaUrl}
                   onChange={(e) => setOllamaUrl(e.target.value)}
                   className="flex-1 bg-black/40 border border-white/10 rounded px-3 py-2 text-white font-mono text-sm focus:border-[#00FFFF]/50 outline-none transition-colors"
                 />
                 <button 
                    onClick={handleTestOllama}
                    disabled={testResult === 'testing'}
                    className="px-4 py-2 bg-[#00FFFF]/10 text-[#00FFFF] border border-[#00FFFF]/30 rounded hover:bg-[#00FFFF]/20 disabled:opacity-50 font-mono text-sm"
                 >
                   {testResult === 'testing' ? 'PINGING...' : 'TEST LINK'}
                 </button>
               </div>

               {testResult === 'success' && (
                 <div className="text-[#00FF88] text-xs font-mono flex items-center gap-2 mt-2">
                   <CheckCircle2 className="w-4 h-4" /> Handshake successful. Cognitive node primed.
                 </div>
               )}
               {testResult === 'error' && (
                 <div className="text-[#FF3838] text-xs font-mono flex items-center gap-2 mt-2">
                   Connection refused. Ensure Ollama is running (`ollama serve`) and CORS allows this origin.
                 </div>
               )}
            </GlassPanel>

            <div className="flex justify-end mt-4">
              <button onClick={() => setStep(2)} className="flex items-center gap-2 px-6 py-2 bg-white text-black font-bold rounded hover:bg-white/80 transition-colors">
                Configure Vault <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-4">
            <p className="text-white/80">
              Your system defaults to maximum security. API keys must reside in the AES-256 Vault. 
            </p>
            
            <GlassPanel className="p-5 border border-white/5 flex flex-col gap-4 !bg-transparent">
              <label className="text-sm font-mono text-[#00FFFF]">Google Gemini API Key (Optional)</label>
              <input 
                type="password" 
                placeholder="AIzaSy..." 
                className="bg-black/40 border border-white/10 rounded px-3 py-2 text-white font-mono text-sm focus:border-[#00FFFF]/50 outline-none"
              />
              <p className="text-xs text-[#6B7A99]">Note: In AI Studio, the GEMINI_API_KEY is already injected by the runtime environment via secrets setup. You may skip this locally.</p>
            </GlassPanel>

            <div className="flex justify-between mt-4">
              <button onClick={() => setStep(1)} className="px-6 py-2 text-white/50 hover:text-white transition-colors">
                Back
              </button>
              <button onClick={handleFinish} className="flex items-center gap-2 px-6 py-2 bg-[#6E00FF] text-white font-bold rounded hover:bg-[#6E00FF]/80 transition-colors shadow-[0_0_20px_rgba(110,0,255,0.4)]">
                Boot NEURO-OS
              </button>
            </div>
          </div>
        )}

      </GlassPanel>
    </div>
  );
}
