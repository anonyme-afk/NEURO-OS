import { GoogleGenAI } from '@google/genai';
import { BaseConnector } from './base';

export class GeminiConnector implements BaseConnector {
  id = 'google_gemini';
  name = 'Google Gemini';
  model_name = 'gemini-2.5-flash';
  is_active = true;
  type: 'local' | 'cloud' = 'cloud';
  consecutive_failures = 0;
  circuit_breaker_open_until = 0;
  private ai: GoogleGenAI;

  constructor() {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      console.warn("GEMINI_API_KEY is not defined. Gemini connector will be inactive.");
      this.is_active = false;
      this.ai = new GoogleGenAI({ apiKey: 'INVALID' }); // Will fail correctly
    } else {
      this.ai = new GoogleGenAI({ apiKey: key });
    }
  }

  async ping(): Promise<boolean> {
    if (!this.is_active) return false;
    try {
      // Small real request to test connection
      await this.ai.models.generateContent({
        model: this.model_name,
        contents: "Return the word OK.",
      });
      return true;
    } catch (e) {
      console.error("[Gemini] Ping failed:", e);
      return false;
    }
  }

  async generate(prompt: string): Promise<string> {
    if (!this.is_active) throw new Error("Gemini connector is not active");
    const response = await this.ai.models.generateContent({
      model: this.model_name,
      contents: prompt,
    });
    return response.text || "";
  }
}
