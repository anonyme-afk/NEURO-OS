import 'dotenv/config';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import { createServer as createHttpServer } from 'http';
import { WebSocketServer } from 'ws';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import { setupApiRoutes } from './src/server/api/routes';
import { eventBus } from './src/server/core/eventBus';

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  // Since this is running in a sandbox/Cloud Run environment behind proxy
  app.set('trust proxy', 1);

  // Apply Security Middlewares First
  app.use(helmet({
    contentSecurityPolicy: false, // disabled for vite dev server
  }));

  app.use(cors({
    origin: process.env.NODE_ENV === 'production' ? ['https://my-secure-frontend.com'] : '*',
    methods: ['GET', 'POST', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Workspace-ID']
  }));
  app.use(express.json({ limit: '1mb' })); // Strict payload limit

  // Apply Security Middlewares
  const { rateLimiter, strictValidation } = await import('./src/server/middleware/security');
  app.use('/api/', rateLimiter);
  app.use('/api/', strictValidation);

  // Mount API Routes
  app.use('/api/v1', setupApiRoutes());

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Create HTTP Server
  const httpServer = createHttpServer(app);

  // Attach WebSocket Server onto the HTTP server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws/brain-activity' });

  wss.on('connection', (ws) => {
    console.log('[WS] Client connected to /ws/brain-activity');

    // Subscribe to EventBus and send messages to this specific client
    const messageHandler = (event: any) => {
      if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify(event));
      }
    };

    eventBus.on('brain_event', messageHandler);

    ws.on('close', () => {
      console.log('[WS] Client disconnected');
      eventBus.off('brain_event', messageHandler);
    });
  });

  httpServer.listen(PORT, () => {
    console.log(`[NEURO-OS] Live and listening on http://0.0.0.0:${PORT}`);
    eventBus.publish('SYSTEM_BOOT', {
      status: 'online',
      boot_time: new Date().toISOString()
    });
  });
}

startServer();
