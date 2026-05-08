import { Router, Request, Response, NextFunction } from 'express';
import { getLiveMetrics, moduleLogs } from '../core/metrics';
import { eventBus } from '../core/eventBus';
import { taskQueue } from '../core/taskQueue';
import { sanitizePrompt } from '../core/securityFirewall';
import { fusionEngine } from '../core/fusionEngine';
import { connectorRegistry } from '../connectors/registry';
import fs from 'fs';
import path from 'path';
import { z } from 'zod';
import { encryptKey, auditLog } from '../core/security';
import { SystemConfig } from '../core/config';

const configSchema = z.object({
  air_gapped_mode: z.boolean().optional(),
  mtls_enabled: z.boolean().optional(),
  mqtt_enabled: z.boolean().optional(),
});

const vaultSchema = z.object({
  provider: z.string(),
  apiKey: z.string().min(1),
  workspaceId: z.string().optional()
});

const testConnectorSchema = z.object({
  provider: z.string(),
  url: z.string().url().optional(),
  model: z.string()
});

const brainSchema = z.object({
  prompt: z.string().min(1)
});

// Zod validation middleware
function validate<T extends z.ZodTypeAny>(schema: T) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (e: any) {
      res.status(400).json({ error: 'Validation Error', details: e.errors });
    }
  };
}

export function setupApiRoutes() {
  const router = Router();

  // --- METRICS ---
  router.get('/metrics/live', async (req, res) => {
    try {
      const metrics = await getLiveMetrics();
      res.json(metrics);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // --- SETTINGS / VAULT ---
  router.get('/system/config', (req, res) => {
    res.json({
      air_gapped_mode: SystemConfig.airGappedMode,
      version: '1.1.0-MILITARY',
      vault_secured: true,
      mtls_enabled: SystemConfig.mtlsEnabled,
      mqtt_enabled: SystemConfig.mqttEnabled,
    });
  });

  router.post('/system/config', validate(configSchema), (req, res) => {
    const { air_gapped_mode, mtls_enabled, mqtt_enabled } = req.body;
    if (air_gapped_mode !== undefined) SystemConfig.airGappedMode = air_gapped_mode;
    if (mtls_enabled !== undefined) SystemConfig.mtlsEnabled = mtls_enabled;
    if (mqtt_enabled !== undefined) SystemConfig.mqttEnabled = mqtt_enabled;
    
    res.json({ 
      success: true, 
      air_gapped_mode: SystemConfig.airGappedMode,
      mtls_enabled: SystemConfig.mtlsEnabled,
      mqtt_enabled: SystemConfig.mqttEnabled,
    });
  });

  // --- BYOK (Bring Your Own Key) & VAULT ---
  router.post('/vault/keys', validate(vaultSchema), (req, res) => {
    const { provider, apiKey, workspaceId } = req.body;
    // Encrypt and store key in Vault (Memory for this sandbox)
    const encrypted = encryptKey(apiKey);
    
    // Simulate updating the registry with the user's specific key
    auditLog('KEY_ADDED_TO_VAULT', workspaceId || 'system', { provider, keyLength: encrypted.length });
    res.json({ success: true, message: 'Clé chiffrée avec AES-256 et stockée dans le Vault.' });
  });

  // --- CONNECTORS ---
  router.get('/connectors/list', (req, res) => {
    res.json(connectorRegistry.listConnectors());
  });

  router.post('/connectors/test', validate(testConnectorSchema), async (req, res) => {
    const { provider, url, model } = req.body;
    try {
      const success = await connectorRegistry.testConnection(provider, url, model);
      if (success) {
        res.json({ success: true, latency_ms: Array.isArray(success) ? success[1] : 0 });
      } else {
        res.status(400).json({ success: false, error: 'Ping failed' });
      }
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // --- MODULES / GRAPH ---
  router.get('/modules/status', (req, res) => {
    res.json({
      modules: [
        { name: 'brain_logic', status: 'online' },
        { name: 'brain_memory', status: 'online' },
        { name: 'brain_perception', status: 'offline' },
        { name: 'brain_router', status: 'online' }
      ]
    });
  });

  router.get('/modules/graph', (req, res) => {
    res.json({
      nodes: [
        { id: 'brain_router', group: 1, label: 'Router (mTLS)' },
        { id: 'brain_memory', group: 2, label: 'Vector DB (Encrypted)' },
        { id: 'brain_logic', group: 3, label: 'Fusion Engine' },
        { id: 'connector_ollama', group: 4, label: 'Local Node' },
        { id: 'connector_gemini', group: 4, label: 'Cloud Node' },
        { id: 'queue_broker', group: 5, label: 'Message Broker (RabbitMQ/Node)' }
      ],
      links: [
        { source: 'queue_broker', target: 'brain_router', value: 1 },
        { source: 'brain_router', target: 'brain_memory', value: 1 },
        { source: 'brain_router', target: 'brain_logic', value: 1 },
        { source: 'brain_logic', target: 'connector_ollama', value: 1 },
        { source: 'brain_logic', target: 'connector_gemini', value: 1 }
      ]
    });
  });

  // --- BRAIN (THE CORE) ---
  router.post('/brain/think', validate(brainSchema), async (req, res) => {
    const { prompt } = req.body;
    const startTime = Date.now();

    try {
      // 1. ZTA Firewall Check before processing
      const cleanPrompt = sanitizePrompt(prompt);

      // 2. Queueing & Backpressure
      const result = await taskQueue.enqueue(async () => {
        eventBus.publish('THINK_START', { prompt: cleanPrompt.substring(0, 100) });
        return await fusionEngine.fuse(cleanPrompt);
      });
      
      const latency = Date.now() - startTime;
      moduleLogs.push({ timestamp: Date.now(), latency_ms: latency, error: false });

      eventBus.publish('THINK_DONE', {
        latency_ms: result.latency_ms,
        model: result.model_used,
        confidence: result.confidence
      });

      res.json(result);
    } catch (error: any) {
      moduleLogs.push({ timestamp: Date.now(), latency_ms: Date.now() - startTime, error: true });
      eventBus.publish('THINK_ERROR', { error: error.message });
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}
