import { BaseConnector } from './base';
import { GeminiConnector } from './gemini';
import { OllamaConnector } from './ollama';
import { dbOps } from '../core/database';
import { decryptKey } from '../core/security';

class ConnectorRegistry {
  private connectors: BaseConnector[] = [];

  constructor() {
    this.reloadFromDatabase();
  }

  reloadFromDatabase() {
    const saved = dbOps.listConnectors();
    const newConnectors: BaseConnector[] = [];

    // Always ensure defaults exist if they are configured in ENV
    if (process.env.GEMINI_API_KEY) {
      newConnectors.push(new GeminiConnector());
    }
    if (process.env.OLLAMA_URL || true) {
      newConnectors.push(new OllamaConnector());
    }

    // Load from DB
    saved.forEach(s => {
      let connector: BaseConnector | null = null;
      const config = JSON.parse(decryptKey(s.encrypted_config));

      if (s.type === 'google_gemini') {
        connector = new GeminiConnector(config.apiKey);
      } else if (s.type === 'ollama_local') {
        connector = new OllamaConnector(config.url, config.model);
      }

      if (connector) {
        connector.id = s.id;
        connector.name = s.name;
        connector.is_active = s.is_active === 1;
        newConnectors.push(connector);
      }
    });

    this.connectors = newConnectors;
  }

  getActiveConnectors(): BaseConnector[] {
    const isAirGapped = dbOps.getSetting('air_gapped_mode') === 'true';
    return this.connectors.filter(c => {
      if (!c.is_active) return false;
      if (isAirGapped && c.type !== 'local') return false;
      return true;
    });
  }

  listConnectors() {
    const isAirGapped = dbOps.getSetting('air_gapped_mode') === 'true';
    return this.connectors.map(c => ({
      id: c.id,
      name: c.name,
      model_name: c.model_name,
      is_active: c.is_active,
      type: c.type,
      air_gapped_blocked: isAirGapped && c.type !== 'local'
    }));
  }

  async testConnection(providerId: string, url?: string, model?: string): Promise<boolean | [boolean, number]> {
    const start = Date.now();
    const connector = this.connectors.find(c => c.id === providerId);
    if (!connector) throw new Error(`Provider ${providerId} not found`);
    
    // If temp config provided for testing
    if (url || model) {
        connector.reconfigure?.({ url, model });
    }

    const isOk = await connector.ping();
    return isOk ? [true, Date.now() - start] : false;
  }
  
  async healthCheck() {
    await Promise.allSettled(this.connectors.map(async (c) => {
      if (c.circuit_breaker_open_until > Date.now()) {
        c.is_active = false;
        dbOps.updateStatus(c.id, 'circuit_broken');
        return;
      }
      const isAlive = await c.ping();
      c.is_active = isAlive;
      dbOps.updateStatus(c.id, isAlive ? 'online' : 'offline');
    }));
  }
}

export const connectorRegistry = new ConnectorRegistry();
