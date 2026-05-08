export interface BaseConnector {
  id: string;
  name: string;
  model_name: string;
  is_active: boolean;
  type: 'local' | 'cloud'; // Crucial for Air-Gapped mode
  
  // Circuit Breaker System
  consecutive_failures: number;
  circuit_breaker_open_until: number; // timestamp
  
  ping(): Promise<boolean>;
  generate(prompt: string): Promise<string>;
}
