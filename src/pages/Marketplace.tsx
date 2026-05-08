import { Download, Cloud, Cpu, Eye, Zap } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { GlassPanel } from '../components/ui/GlassPanel';

export function Marketplace() {
  const modules = [
    { id: 1, name: 'Vision Perception Beta', desc: 'Adds OpenCV & Whisper integration to the brain to analyze images uploaded in prompts.', icon: <Eye />, type: 'Core', status: 'Available' },
    { id: 2, name: 'Robotic Arm Motion', desc: 'Hooks into ROS2 topics to translate brain logic outputs into standard XYZ servo coordinates.', icon: <Cpu />, type: 'Hardware', status: 'Coming Soon' },
    { id: 3, name: 'Crypto Sentinel', desc: 'Real-time WebSocket feed into Binance for autonomous trading logic ingestion.', icon: <Zap />, type: 'Data', status: 'Incompatible (Air-Gapped)' },
    { id: 4, name: 'Distributed Mesh Node', desc: 'LibP2P module allowing your brain to share compute with other trusted NEURO-OS instances globally.', icon: <Cloud />, type: 'Network', status: 'Available' }
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto flex flex-col gap-8 flex-1">
      <PageHeader 
        icon={<Download className="text-[#6E00FF]" />} 
        title="Synaptic Marketplace" 
        description="Download community modules to extend brain capabilities." 
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {modules.map(m => (
          <GlassPanel key={m.id} className="flex flex-col gap-4 relative overflow-hidden group hover:border-[#6E00FF]/50 transition-colors">
            
            <div className="flex justify-between items-start">
               <div className="w-12 h-12 bg-[#6E00FF]/10 text-[#00FFFF] flex items-center justify-center rounded-lg border border-[#6E00FF]/30">
                  {m.icon}
               </div>
               <span className="text-[10px] uppercase font-mono tracking-wider text-[#6B7A99] px-2 py-1 bg-white/5 rounded border border-white/10">
                 {m.type}
               </span>
            </div>

            <div className="flex-1">
              <h3 className="text-lg font-bold font-mono text-white mb-2">{m.name}</h3>
              <p className="text-sm text-[#6B7A99]">{m.desc}</p>
            </div>

            <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center">
              <span className={`text-xs font-mono ${m.status === 'Available' ? 'text-[#00FF88]' : 'text-[#FFB800]'}`}>
                {m.status}
              </span>
              
              <button 
                disabled={m.status !== 'Available'}
                className="px-4 py-2 bg-white/5 hover:bg-[#6E00FF]/20 border border-white/10 hover:border-[#6E00FF]/50 rounded text-sm font-mono transition-colors disabled:opacity-30 disabled:hover:bg-white/5"
              >
                {m.status === 'Available' ? 'Install Node' : 'Locked'}
              </button>
            </div>
            
          </GlassPanel>
        ))}
      </div>
    </div>
  );
}
