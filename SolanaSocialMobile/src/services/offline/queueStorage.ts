import AsyncStorage from '@react-native-async-storage/async-storage';
// Note: MMKV would be installed as: npm install react-native-mmkv
// For now, we'll simulate with AsyncStorage and add MMKV support later
import {nanoid} from 'nanoid/non-secure';

// Simulated MMKV storage using AsyncStorage for now
class SimulatedMMKV {
  private prefix = 'mmkv_';

  set(key: string, value: string): void {
    AsyncStorage.setItem(`${this.prefix}${key}`, value);
  }

  getString(key: string): string | undefined {
    // This is async but we're simulating sync behavior
    // In real implementation, MMKV would be synchronous
    let result: string | undefined;
    AsyncStorage.getItem(`${this.prefix}${key}`).then(value => {
      result = value || undefined;
    });
    return result;
  }

  delete(key: string): void {
    AsyncStorage.removeItem(`${this.prefix}${key}`);
  }
}

const storage = new SimulatedMMKV();

export enum QueueItemStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  FAILED = 'failed',
  COMPLETED = 'completed',
}

export enum QueueItemType {
  BLOCKCHAIN_TX = 'blockchain_tx',
  API_REQUEST = 'api_request',
  MEDIA_UPLOAD = 'media_upload',
  SYNC_OPERATION = 'sync_operation',
}

export interface QueueItem {
  id: string;
  type: QueueItemType;
  status: QueueItemStatus;
  priority: number; // 1-10, higher = more important
  createdAt: number;
  updatedAt: number;
  retryCount: number;
  maxRetries: number;
  data: any;
  error?: string;
  dependencies?: string[]; // IDs of items that must complete first
}

class QueueStorage {
  private readonly QUEUE_KEY = 'offline_queue_items';
  private readonly INDEX_KEY = 'offline_queue_index';

  async addItem(
    item: Omit<QueueItem, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<string> {
    const id = nanoid();
    const now = Date.now();

    const queueItem: QueueItem = {
      ...item,
      id,
      createdAt: now,
      updatedAt: now,
      status: QueueItemStatus.PENDING,
      retryCount: 0,
    };

    // Store in fast storage (MMKV simulation)
    storage.set(id, JSON.stringify(queueItem));

    // Update index
    const index = await this.getIndex();
    index.push(id);
    await this.saveIndex(index);

    // Backup to AsyncStorage for persistence
    await this.backupToAsyncStorage(id, queueItem);

    return id;
  }

  async getItem(id: string): Promise<QueueItem | null> {
    try {
      // Try fast storage first
      const data = storage.getString(id);
      if (data) {
        return JSON.parse(data);
      }

      // Fall back to AsyncStorage
      return this.restoreFromAsyncStorage(id);
    } catch (error) {
      console.error('Error getting queue item:', error);
      return null;
    }
  }

  async updateItem(id: string, updates: Partial<QueueItem>): Promise<void> {
    const item = await this.getItem(id);
    if (!item) {
      throw new Error('Queue item not found');
    }

    const updatedItem = {
      ...item,
      ...updates,
      updatedAt: Date.now(),
    };

    storage.set(id, JSON.stringify(updatedItem));
    await this.backupToAsyncStorage(id, updatedItem);
  }

  async removeItem(id: string): Promise<void> {
    storage.delete(id);
    await AsyncStorage.removeItem(`queue_item_${id}`);

    const index = await this.getIndex();
    const newIndex = index.filter(itemId => itemId !== id);
    await this.saveIndex(newIndex);
  }

  async getPendingItems(): Promise<QueueItem[]> {
    const index = await this.getIndex();
    const items: QueueItem[] = [];

    for (const id of index) {
      const item = await this.getItem(id);
      if (item && item.status === QueueItemStatus.PENDING) {
        items.push(item);
      }
    }

    // Sort by priority (desc) and createdAt (asc)
    return items.sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      return a.createdAt - b.createdAt;
    });
  }

  async getFailedItems(): Promise<QueueItem[]> {
    const index = await this.getIndex();
    const items: QueueItem[] = [];

    for (const id of index) {
      const item = await this.getItem(id);
      if (item && item.status === QueueItemStatus.FAILED) {
        items.push(item);
      }
    }

    return items;
  }

  async getAllItems(): Promise<QueueItem[]> {
    const index = await this.getIndex();
    const items: QueueItem[] = [];

    for (const id of index) {
      const item = await this.getItem(id);
      if (item) {
        items.push(item);
      }
    }

    return items;
  }

  private async getIndex(): Promise<string[]> {
    try {
      const data = await AsyncStorage.getItem(this.INDEX_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting queue index:', error);
      return [];
    }
  }

  private async saveIndex(index: string[]): Promise<void> {
    try {
      await AsyncStorage.setItem(this.INDEX_KEY, JSON.stringify(index));
    } catch (error) {
      console.error('Error saving queue index:', error);
    }
  }

  private async backupToAsyncStorage(
    id: string,
    item: QueueItem,
  ): Promise<void> {
    try {
      await AsyncStorage.setItem(`queue_item_${id}`, JSON.stringify(item));
    } catch (error) {
      console.error('Error backing up queue item:', error);
    }
  }

  private async restoreFromAsyncStorage(id: string): Promise<QueueItem | null> {
    try {
      const data = await AsyncStorage.getItem(`queue_item_${id}`);
      if (data) {
        const item = JSON.parse(data);
        // Restore to fast storage
        storage.set(id, data);
        return item;
      }
      return null;
    } catch (error) {
      console.error('Error restoring queue item:', error);
      return null;
    }
  }

  async clearCompleted(): Promise<void> {
    const index = await this.getIndex();
    const newIndex: string[] = [];

    for (const id of index) {
      const item = await this.getItem(id);
      if (item && item.status !== QueueItemStatus.COMPLETED) {
        newIndex.push(id);
      } else if (item) {
        await this.removeItem(id);
      }
    }

    await this.saveIndex(newIndex);
  }

  async getQueueStats(): Promise<{
    total: number;
    pending: number;
    processing: number;
    failed: number;
    completed: number;
  }> {
    const items = await this.getAllItems();

    return {
      total: items.length,
      pending: items.filter(i => i.status === QueueItemStatus.PENDING).length,
      processing: items.filter(i => i.status === QueueItemStatus.PROCESSING)
        .length,
      failed: items.filter(i => i.status === QueueItemStatus.FAILED).length,
      completed: items.filter(i => i.status === QueueItemStatus.COMPLETED)
        .length,
    };
  }

  // Initialize storage (restore from AsyncStorage to fast storage)
  async initialize(): Promise<void> {
    try {
      const index = await this.getIndex();

      // Restore all items to fast storage
      for (const id of index) {
        const item = await this.restoreFromAsyncStorage(id);
        if (item) {
          storage.set(id, JSON.stringify(item));
        }
      }

      console.log('Queue storage initialized');
    } catch (error) {
      console.error('Error initializing queue storage:', error);
    }
  }
}

export const queueStorage = new QueueStorage();
