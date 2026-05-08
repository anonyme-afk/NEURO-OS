import { EventEmitter } from 'events';

export class EventBus extends EventEmitter {
  constructor() {
    super();
    // Increase listener limits if many clients connect
    this.setMaxListeners(100);
  }

  /**
   * Publishes a completely REAL event into the system.
   * This is sent to the local process and broadcast to all connected WebSockets.
   */
  publish(eventType: string, data: any) {
    const payload = {
      type: eventType,
      timestamp: new Date().toISOString(),
      data: data
    };
    
    // Emit internally
    this.emit('brain_event', payload);
  }
}

export const eventBus = new EventBus();
