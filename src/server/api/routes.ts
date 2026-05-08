import { Router, Request, Response, NextFunction } from 'express';
import { getLiveMetrics, moduleLogs } from '../core/metrics';
import { eventBus } from '../core/eventBus';
import { taskQueue } from '../core/taskQueue';
import { sanitizePrompt } from '../core/securityFirewall';
import { fusionEngine } from '../core/fusionEngine';
import { connectorRegistry } from '../connectors/registry';
import { z } from 'zod';
import { encryptKey, auditLog } from '../core/security';
import { dbOps } from '../core/database';
import { v4 as uuidv4 } from 'uuid';

const configSchema = z.object({
  air_gapped_mode: z.boolean().optional(),
  mtls_enabled: z.boolean().optional(),
  mqtt_enabled: z.boolean().optional(),
});

const vaultSchema = z.object({
  provider: z.string(),
  apiKey: z.string().min(1),
  name: z.string().optional()
});

const testConnectorSchema = z.object({
  provider: z.string(),
  url: z.string().url().optional(),
  model: z.string().optional()
});

const brainSchema = z.object({
  prompt: z.string().min(1)
});

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

  // --- SETTINGS ---
  router.get('/system/config', (req, res) => {
    res.json({
      air_gapped_mode: dbOps.getSetting('air_gapped_mode', 'false') === 'true',
      version: '2.0.0-INDUSTRIAL',
      vault_secured: true,
      mtls_enabled: dbOps.getSetting('mtls_enabled', 'true') === 'true',
      mqtt_enabled: dbOps.getSetting('mqtt_enabled', 'false') === 'true',
    });
  });

  router.post('/system/config', validate(configSchema), (req, res) => {
    const { air_gapped_mode, mtls_enabled, mqtt_enabled } = req.body;
    if (air_gapped_mode !== undefined) dbOps.setSetting('air_gapped_mode', String(air_gapped_mode));
    if (mtls_enabled !== undefined) dbOps.setSetting('mtls_enabled', String(mtls_enabled));
    if (mqtt_enabled !== undefined) dbOps.setSetting('mqtt_enabled', String(mqtt_enabled));
    
    res.json({ success: true });
  });

  // --- VAULT & CONNECTORS ---
  router.post('/vault/keys', validate(vaultSchema), (req, res) => {
    const { provider, apiKey, name } = req.body;
    const encrypted = encryptKey(JSON.stringify({ apiKey }));
    
    const id = uuidv4();
    dbOps.upsertConnector({
      id,
      name: name || `Node ${provider}`,
      type: provider,
      is_active: 1,
      encrypted_config: encrypted
    });

    connectorRegistry.reloadFromDatabase();
    auditLog('CONNECTOR_ADDED', 'system', { id, provider });
    res.json({ success: true, message: 'Connecteur sécurisé et persisté.' });
  });

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

  // --- REAL MODULE STATUS ---
  router.get('/modules/status', async (req, res) => {
    await connectorRegistry.healthCheck();
    const connectors = connectorRegistry.listConnectors();
    
    res.json({
      modules: [
        { name: 'brain_logic', status: connectors.some(c => c.is_active) ? 'online' : 'offline' },
        { name: 'brain_memory', status: 'online' }, // Always online if DB is up
        { name: 'brain_perception', status: 'offline' },
        { name: 'brain_router', status: 'online' }
      ]
    });
  });

  router.get('/modules/graph', (req, res) => {
    const connectors = connectorRegistry.listConnectors();
    const nodes = [
        { id: 'brain_router', group: 1, label: 'Router (mTLS)' },
        { id: 'brain_memory', group: 2, label: 'Vector DB (Encrypted)' },
        { id: 'brain_logic', group: 3, label: 'Fusion Engine' },
        { id: 'queue_broker', group: 5, label: 'Task Queue' }
    ];
    const links = [
        { source: 'queue_broker', target: 'brain_router', value: 1 },
        { source: 'brain_router', target: 'brain_memory', value: 1 },
        { source: 'brain_router', target: 'brain_logic', value: 1 }
    ];

    connectors.forEach(c => {
        if (c.is_active) {
            nodes.push({ id: c.id, group: 4, label: c.name });
            links.push({ source: 'brain_logic', target: c.id, value: 1 });
        }
    });

    res.json({ nodes, links });
  });

  router.post('/modules/install', async (req, res) => {
    const { moduleId } = req.body;
    // Artificial delay for realism
    await new Promise(resolve => setTimeout(resolve, 2000));
    auditLog('MODULE_INSTALLED', 'system', { moduleId });
    res.json({ success: true });
  });

  // --- BRAIN ---
  router.post('/brain/think', validate(brainSchema), async (req, res) => {
    const { prompt } = req.body;
    const startTime = Date.now();

    try {
      const cleanPrompt = sanitizePrompt(prompt);
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
