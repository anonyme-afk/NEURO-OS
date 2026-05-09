import { BaseConnector } from './base';
import { GeminiConnector } from './gemini';
import { OllamaConnector } from './ollama';
import { dbOps } from '../core/database';
import { decryptKey } from '../core/security';

class ConnectorRegistry {
  private connectors: BaseConnector[] = [];
  private dbReady = false;

  constructor() {
    // Initialisation différée — attend que la DB soit prête
    this.init();
  }

  private async init() {
    try {
      await this.reloadFromDatabase();
      this.dbReady = true;
    } catch (e) {
      console.warn('[Registry] DB not ready yet, connectors loaded from ENV only:', (e as Error).message);
      // Fallback: charger les connecteurs depuis les variables d'env uniquement
      this.loadFromEnv();
      this.dbReady = true;
    }
  }

  private loadFromEnv() {
    this.connectors = [];
    if (process.env.GEMINI_API_KEY) {
      this.connectors.push(new GeminiConnector());
    }
    this.connectors.push(new OllamaConnector());
  }

  async reloadFromDatabase() {
    const saved = await dbOps.listConnectors();
    const newConnectors: BaseConnector[] = [];

    // Always ensure defaults exist if they are configured in ENV
    if (process.env.GEMINI_API_KEY) {
      newConnectors.push(new GeminiConnector());
    }
    if (process.env.OLLAMA_URL || true) {
      newConnectors.push(new OllamaConnector());
    }

    // Load from DB
    if (Array.isArray(saved)) {
      saved.forEach((s: any) => {
        let connector: BaseConnector | null = null;
        try {
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
        } catch {
          // Skip invalid connector records
        }
      });
    }

    this.connectors = newConnectors;
  }

  getActiveConnectors(): BaseConnector[] {
    const isAirGapped = false; // Will be re-evaluated from DB when needed
    return this.connectors.filter(c => {
      if (!c.is_active) return false;
      if (isAirGapped && c.type !== 'local') return false;
      return true;
    });
  }

  listConnectors() {
    const isAirGapped = false; // Will be re-evaluated from DB when needed
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
        await dbOps.updateStatus(c.id, 'circuit_broken');
        return;
      }
      const isAlive = await c.ping();
      c.is_active = isAlive;
      await dbOps.updateStatus(c.id, isAlive ? 'online' : 'offline');
    }));
  }
}

export const connectorRegistry = new ConnectorRegistry();