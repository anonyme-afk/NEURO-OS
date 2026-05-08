import { GoogleGenAI } from '@google/genai';
import { BaseConnector } from './base';

export class GeminiConnector implements BaseConnector {
  id = 'google_gemini';
  name = 'Google Gemini';
  model_name = 'gemini-1.5-flash';
  is_active = true;
  type: 'local' | 'cloud' = 'cloud';
  consecutive_failures = 0;
  circuit_breaker_open_until = 0;
  private ai: GoogleGenAI;

  constructor(apiKey?: string) {
    const key = apiKey || process.env.GEMINI_API_KEY;
    if (!key) {
      this.is_active = false;
      this.ai = new GoogleGenAI({ apiKey: 'INVALID' });
    } else {
      this.ai = new GoogleGenAI({ apiKey: key });
    }
  }

  reconfigure(config: any) {
    if (config.apiKey) {
      this.ai = new GoogleGenAI({ apiKey: config.apiKey });
      this.is_active = true;
    }
    if (config.model) {
      this.model_name = config.model;
    }
  }

  async ping(): Promise<boolean> {
    if (!this.is_active) return false;
    try {
      // Light check
      await this.ai.models.get({ model: this.model_name });
      return true;
    } catch (e) {
      return false;
    }
  }

  async generate(prompt: string): Promise<string> {
    if (!this.is_active) throw new Error("Gemini connector is not active");
    const response = await this.ai.models.generateContent({
      model: this.model_name,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });
    return response.text || "";
  }
}
