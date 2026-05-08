import { useState, useEffect } from 'react';
import { Lock, Shield, Server, ShieldAlert, RadioReceiver, KeyRound } from 'lucide-react';
import { apiFetch } from '../lib/api';
import { PageHeader } from '../components/ui/PageHeader';
import { GlassPanel } from '../components/ui/GlassPanel';
import { ToggleSwitch } from '../components/ui/ToggleSwitch';

export function Settings() {
  const [config, setConfig] = useState<any>(null);
  const [connectors, setConnectors] = useState<any[]>([]);

  const fetchData = async () => {
    try {
      const conf = await apiFetch<any>('/system/config');
      const conn = await apiFetch<any[]>('/connectors/list');
      setConfig(conf);
      setConnectors(conn);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const toggleSetting = async (key: string) => {
    try {
      await apiFetch('/system/config', {
        method: 'POST',
        body: { [key]: !config[key] }
      });
      fetchData(); // reload
    } catch (e) {
      console.error(e);
    }
  };

  if (!config) return <div className="p-10 font-mono text-[#00FFFF]">Decrypting Vault...</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto flex flex-col gap-8 flex-1">
      <PageHeader 
        icon={<Shield className="text-[#00FFFF]" />} 
        title="Security Vault & Config" 
        description="Manage API Keys, mTLS Zero Trust, and IoT endpoints." 
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <GlassPanel className="relative overflow-hidden flex flex-col gap-6">
          
          <div>
            <h2 className="text-xl font-bold mb-4 font-mono text-[#00FFFF] flex items-center gap-2">
              <Server className="w-5 h-5" /> Data Sovereignty
            </h2>
            
            <div className="flex items-center justify-between p-4 bg-black/20 rounded-lg border border-white/5">
              <div>
                <div className="font-bold">Air-Gapped Mode</div>
                <div className="text-xs text-[#6B7A99] max-w-xs mt-1">Blocks ALL cloud connectors. Brain runs purely on local networks (Zero Exfiltration).</div>
              </div>
              <ToggleSwitch checked={config.air_gapped_mode} onChange={() => toggleSetting('air_gapped_mode')} />
            </div>
          </div>

          <div>
             <h2 className="text-xl font-bold mb-4 font-mono text-[#00FFFF] flex items-center gap-2 mt-4">
              <KeyRound className="w-5 h-5" /> Zero Trust (ZTA)
            </h2>
             <div className="flex items-center justify-between p-4 bg-black/20 rounded-lg border border-white/5">
              <div>
                <div className="font-bold flex items-center gap-2">mTLS Enforced <span className="text-[10px] bg-[#FF3838] px-1 rounded">Strict</span></div>
                <div className="text-xs text-[#6B7A99] max-w-xs mt-1">Requires valid x509 certificates to perform inner-module RPCs.</div>
              </div>
              <ToggleSwitch checked={config.mtls_enabled} onChange={() => toggleSetting('mtls_enabled')} />
            </div>
          </div>
          
          <div>
            <h2 className="text-xl font-bold mb-4 font-mono text-[#00FFFF] flex items-center gap-2 mt-4">
              <RadioReceiver className="w-5 h-5" /> IoT & Hardware (Edge)
            </h2>
            <div className="flex items-center justify-between p-4 bg-black/20 rounded-lg border border-white/5">
              <div>
                <div className="font-bold">MQTT Broker Bridge</div>
                <div className="text-xs text-[#6B7A99] max-w-xs mt-1">Listen to raw sensory topics (e.g. `robot/sensors/cam1`).</div>
              </div>
              <ToggleSwitch checked={config.mqtt_enabled} onChange={() => toggleSetting('mqtt_enabled')} />
            </div>
          </div>

        </GlassPanel>

        <GlassPanel className="flex flex-col gap-4">
           <h2 className="text-xl font-bold font-mono text-[#00FFFF] flex items-center gap-2">
            <Lock className="w-5 h-5" /> AES-256 Key Vault
          </h2>
          <p className="text-xs text-[#6B7A99]">Keys are encrypted at rest. Displaying currently loaded connectors into memory.</p>
          
          <div className="flex flex-col gap-2">
            {connectors.map(c => (
              <div key={c.id} className="flex justify-between items-center p-3 bg-black/20 rounded-lg border border-white/5">
                <div className="flex items-center gap-3">
                   <div className={`w-2 h-2 rounded-full ${c.is_active ? 'bg-[#00FF88]' : (c.air_gapped_blocked ? 'bg-[#FFB800]' : 'bg-[#FF3838]')}`} />
                   <span className="font-mono text-sm">{c.name}</span>
                </div>
                <div className="text-xs text-[#6B7A99]">
                   {c.air_gapped_blocked ? <span className="text-[#FFB800] flex items-center gap-1"><ShieldAlert className="w-4 h-4" /> Blocked by Air-Gap</span> : (c.type === 'local' ? 'Local Network' : 'Cloud Remote')}
                </div>
              </div>
            ))}
          </div>

          <button className="mt-auto px-4 py-2 border border-[#00FFFF]/30 text-[#00FFFF] hover:bg-[#00FFFF]/10 rounded font-mono text-sm uppercase self-start">
            + Add to Vault
          </button>
          
          <div className="mt-6 pt-6 border-t border-white/10">
             <h3 className="font-bold text-sm mb-2 text-white">Migration Vectorielle</h3>
             <p className="text-xs text-[#6B7A99] mb-4">Mettre à jour l'espace latent vers la nouvelle version du modèle d'embedding (all-MiniLM {`->`} text-embedding-3).</p>
             <button className="px-4 py-2 bg-white/5 border border-white/20 text-[#6B7A99] rounded font-mono text-sm hover:text-white hover:border-white transition-colors">
               LANCER LA MIGRATION DB
             </button>
          </div>
        </GlassPanel>
      </div>
    </div>
  );
}
