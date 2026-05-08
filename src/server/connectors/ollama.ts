import { BaseConnector } from './base';

export class OllamaConnector implements BaseConnector {
  id = 'ollama_local';
  name = 'Ollama Local';
  model_name: string;
  is_active = true;
  type: 'local' | 'cloud' = 'local';
  consecutive_failures = 0;
  circuit_breaker_open_until = 0;
  private url: string;

  constructor(url?: string, model?: string) {
    this.url = (url || process.env.OLLAMA_URL || 'http://localhost:11434').replace(/\/$/, "");
    this.model_name = model || 'llama3';
  }

  reconfigure(config: any) {
    if (config.url) this.url = config.url.replace(/\/$/, "");
    if (config.model) this.model_name = config.model;
  }

  async ping(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2000);
      
      const res = await fetch(`${this.url}/api/tags`, { signal: controller.signal });
      clearTimeout(timeout);
      
      if (!res.ok) return false;
      
      const data = await res.json();
      return !!(data.models && data.models.length > 0);
    } catch (e) {
      return false;
    }
  }

  async generate(prompt: string): Promise<string> {
    const res = await fetch(`${this.url}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.model_name,
        prompt: prompt,
        stream: false
      })
    });
    
    if (!res.ok) throw new Error(`Ollama HTTP Error ${res.status}`);
    const data = await res.json();
    return data.response;
  }
}
