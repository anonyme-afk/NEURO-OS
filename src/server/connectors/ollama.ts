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

  constructor() {
    this.url = (process.env.OLLAMA_URL || 'http://localhost:11434').replace(/\/$/, "");
    this.model_name = 'llama3'; // Default, we will attempt to ping whatever is loaded
  }

  async ping(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2000);
      
      const res = await fetch(`${this.url}/api/tags`, { signal: controller.signal });
      clearTimeout(timeout);
      
      if (!res.ok) return false;
      
      const data = await res.json();
      if (data.models && data.models.length > 0) {
        this.model_name = data.models[0].name; // Use first available model dynamically
        return true;
      }
      return false;
    } catch (e) {
      return false; // Ollama is likely not running locally
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
