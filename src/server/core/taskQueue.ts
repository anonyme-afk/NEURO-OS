import { EventBus, eventBus } from './eventBus';
import PQueue from 'p-queue';

export class TaskQueue {
  private queue: PQueue;
  private MAX_QUEUE_SIZE = 100; // Protection against memory overflow
  private events: EventBus;

  constructor(events: EventBus) {
    this.events = events;
    this.queue = new PQueue({ concurrency: 1 });
    
    this.queue.on('add', () => {
        this.events.publish('QUEUE_UPDATE', { size: this.queue.size });
    });
    
    this.queue.on('next', () => {
        this.events.publish('QUEUE_UPDATE', { size: this.queue.size });
    });
  }

  async enqueue<T>(task: () => Promise<T>): Promise<T> {
    if (this.queue.size >= this.MAX_QUEUE_SIZE) {
      this.events.publish('BACKPRESSURE_TRIGGER', { status: 'rejected', queue_size: this.queue.size });
      throw new Error("BACKPRESSURE: Cerveau saturé. Veuillez ralentir (Queue pleine).");
    }
    
    return this.queue.add(task) as Promise<T>;
  }

  get size() {
    return this.queue.size;
  }
}

export const taskQueue = new TaskQueue(eventBus);
