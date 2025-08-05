import NetInfo from '@react-native-community/netinfo';
import {EventEmitter} from 'events';
import {
  queueStorage,
  QueueItem,
  QueueItemStatus,
  QueueItemType,
} from './queueStorage';
import {apiProcessor} from './processors/apiProcessor';
import {blockchainProcessor} from './processors/blockchainProcessor';
import {mediaProcessor} from './processors/mediaProcessor';

interface QueueEvents {
  'item:added': (item: QueueItem) => void;
  'item:processing': (item: QueueItem) => void;
  'item:completed': (item: QueueItem) => void;
  'item:failed': (item: QueueItem, error: Error) => void;
  'queue:empty': () => void;
  'network:changed': (isConnected: boolean) => void;
}

interface ProcessorInterface {
  process(item: QueueItem): Promise<any>;
}

class QueueProcessor extends EventEmitter {
  private isProcessing = false;
  private isConnected = true;
  private processingInterval?: NodeJS.Timeout;
  private processors = new Map<QueueItemType, ProcessorInterface>();
  private isInitialized = false;

  constructor() {
    super();
  }

  registerProcessor(type: QueueItemType, processor: ProcessorInterface) {
    this.processors.set(type, processor);
  }

  private registerDefaultProcessors() {
    this.processors.set(QueueItemType.API_REQUEST, apiProcessor);
    this.processors.set(QueueItemType.BLOCKCHAIN_TX, blockchainProcessor);
    this.processors.set(QueueItemType.MEDIA_UPLOAD, mediaProcessor);
  }

  async initialize() {
    if (this.isInitialized) {
      return;
    }

    try {
      // Register default processors
      this.registerDefaultProcessors();

      // Initialize storage
      await queueStorage.initialize();

      // Monitor network connectivity
      const unsubscribe = NetInfo.addEventListener(state => {
        const wasConnected = this.isConnected;
        this.isConnected = state.isConnected ?? false;

        console.log('Network status changed:', this.isConnected);
        this.emit('network:changed', this.isConnected);

        // Start processing when connection restored
        if (!wasConnected && this.isConnected) {
          this.startProcessing();
        } else if (!this.isConnected) {
          this.stopProcessing();
        }
      });

      // Get initial network state
      const netState = await NetInfo.fetch();
      this.isConnected = netState.isConnected ?? false;

      if (this.isConnected) {
        this.startProcessing();
      }

      this.isInitialized = true;
      console.log('Queue processor initialized');

      return () => {
        unsubscribe();
        this.stopProcessing();
      };
    } catch (error) {
      console.error('Error initializing queue processor:', error);
    }
  }

  startProcessing() {
    if (this.processingInterval || !this.isConnected) {
      return;
    }

    console.log('Starting queue processing');

    // Process immediately
    this.processQueue();

    // Then process every 30 seconds
    this.processingInterval = setInterval(() => {
      this.processQueue();
    }, 30000);
  }

  stopProcessing() {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = undefined;
      console.log('Stopped queue processing');
    }
  }

  async addToQueue(
    item: Omit<QueueItem, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<string> {
    try {
      const id = await queueStorage.addItem(item);
      const queueItem = await queueStorage.getItem(id);

      if (queueItem) {
        this.emit('item:added', queueItem);

        // Process immediately if connected and high priority
        if (this.isConnected && !this.isProcessing && item.priority >= 8) {
          this.processQueue();
        }
      }

      return id;
    } catch (error) {
      console.error('Error adding item to queue:', error);
      throw error;
    }
  }

  private async processQueue() {
    if (this.isProcessing || !this.isConnected) {
      return;
    }

    this.isProcessing = true;

    try {
      const items = await queueStorage.getPendingItems();

      if (items.length === 0) {
        this.emit('queue:empty');
        return;
      }

      console.log(`Processing ${items.length} queue items`);

      // Process items respecting dependencies
      for (const item of items) {
        if (await this.canProcess(item)) {
          await this.processItem(item);
        }
      }

      // Retry failed items with exponential backoff
      const failedItems = await queueStorage.getFailedItems();
      for (const item of failedItems) {
        if (this.shouldRetry(item)) {
          await this.processItem(item);
        }
      }
    } catch (error) {
      console.error('Error processing queue:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  private async canProcess(item: QueueItem): Promise<boolean> {
    if (!item.dependencies || item.dependencies.length === 0) {
      return true;
    }

    // Check if all dependencies are completed
    for (const depId of item.dependencies) {
      const dep = await queueStorage.getItem(depId);
      if (!dep || dep.status !== QueueItemStatus.COMPLETED) {
        return false;
      }
    }

    return true;
  }

  private shouldRetry(item: QueueItem): boolean {
    if (item.retryCount >= item.maxRetries) {
      return false;
    }

    // Exponential backoff: 2^retryCount * 60 seconds
    const backoffTime = Math.pow(2, item.retryCount) * 60 * 1000;
    const timeSinceLastAttempt = Date.now() - item.updatedAt;

    return timeSinceLastAttempt >= backoffTime;
  }

  private async processItem(item: QueueItem) {
    const processor = this.processors.get(item.type);
    if (!processor) {
      console.error(`No processor registered for type: ${item.type}`);
      await queueStorage.updateItem(item.id, {
        status: QueueItemStatus.FAILED,
        error: `No processor for type: ${item.type}`,
      });
      return;
    }

    try {
      console.log(`Processing item ${item.id} (${item.type})`);

      // Update status to processing
      await queueStorage.updateItem(item.id, {
        status: QueueItemStatus.PROCESSING,
      });

      const updatedItem = await queueStorage.getItem(item.id);
      if (updatedItem) {
        this.emit('item:processing', updatedItem);
      }

      // Process the item
      const result = await processor.process(item);

      // Update status to completed
      await queueStorage.updateItem(item.id, {
        status: QueueItemStatus.COMPLETED,
        data: {...item.data, result},
      });

      const completedItem = await queueStorage.getItem(item.id);
      if (completedItem) {
        this.emit('item:completed', completedItem);
        console.log(`Completed processing item ${item.id}`);
      }
    } catch (error: any) {
      console.error(`Error processing item ${item.id}:`, error);

      // Update status to failed
      await queueStorage.updateItem(item.id, {
        status: QueueItemStatus.FAILED,
        retryCount: item.retryCount + 1,
        error: error.message || 'Unknown error',
      });

      const failedItem = await queueStorage.getItem(item.id);
      if (failedItem) {
        this.emit('item:failed', failedItem, error);
      }
    }
  }

  async retryItem(id: string): Promise<void> {
    try {
      const item = await queueStorage.getItem(id);
      if (!item) {
        return;
      }

      await queueStorage.updateItem(id, {
        status: QueueItemStatus.PENDING,
        error: undefined,
      });

      if (this.isConnected && !this.isProcessing) {
        this.processQueue();
      }
    } catch (error) {
      console.error('Error retrying item:', error);
    }
  }

  async cancelItem(id: string): Promise<void> {
    try {
      await queueStorage.removeItem(id);
    } catch (error) {
      console.error('Error canceling item:', error);
    }
  }

  async getQueueStatus(): Promise<{
    pending: number;
    processing: number;
    failed: number;
    completed: number;
    isConnected: boolean;
  }> {
    try {
      const stats = await queueStorage.getQueueStats();
      return {
        pending: stats.pending,
        processing: stats.processing,
        failed: stats.failed,
        completed: stats.completed,
        isConnected: this.isConnected,
      };
    } catch (error) {
      console.error('Error getting queue status:', error);
      return {
        pending: 0,
        processing: 0,
        failed: 0,
        completed: 0,
        isConnected: this.isConnected,
      };
    }
  }

  async clearCompleted(): Promise<void> {
    try {
      await queueStorage.clearCompleted();
    } catch (error) {
      console.error('Error clearing completed items:', error);
    }
  }

  getIsConnected(): boolean {
    return this.isConnected;
  }

  getIsProcessing(): boolean {
    return this.isProcessing;
  }

  // Force process queue (for manual triggers)
  async forceProcessQueue(): Promise<void> {
    if (!this.isConnected) {
      console.warn('Cannot force process queue when offline');
      return;
    }

    await this.processQueue();
  }
}

export const queueProcessor = new QueueProcessor();
