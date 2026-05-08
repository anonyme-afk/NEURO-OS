import { EventEmitter } from 'events';
import { createClient } from 'redis';

export class EventBus extends EventEmitter {
  private redisClient: any;
  private redisEnabled = false;

  constructor() {
    super();
    this.setMaxListeners(100);
    this.initRedis();
  }

  private async initRedis() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    try {
      this.redisClient = createClient({ url: redisUrl });
      this.redisClient.on('error', (err: any) => {
        console.warn('[EventBus] Redis disconnected, using local bus only.');
        this.redisEnabled = false;
      });
      await this.redisClient.connect();
      this.redisEnabled = true;
      console.log('[EventBus] Redis connected successfully.');
    } catch (e) {
      this.redisEnabled = false;
    }
  }

  publish(eventType: string, data: any) {
    const payload = {
      type: eventType,
      timestamp: new Date().toISOString(),
      data: data
    };
    
    // Internal Emit (for local WS and listeners)
    this.emit('brain_event', payload);

    // Distributed Emit (for other instances)
    if (this.redisEnabled) {
      this.redisClient.publish('neuro_os_events', JSON.stringify(payload));
    }
  }
}

export const eventBus = new EventBus();
