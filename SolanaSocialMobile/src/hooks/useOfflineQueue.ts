import {useState, useEffect, useCallback} from 'react';
import {queueProcessor} from '../services/offline/queueProcessor';
import {
  queueStorage,
  QueueItem,
  QueueItemStatus,
} from '../services/offline/queueStorage';

interface QueueStatus {
  pending: number;
  processing: number;
  failed: number;
  completed: number;
  isConnected: boolean;
}

export function useOfflineQueue() {
  const [status, setStatus] = useState<QueueStatus>({
    pending: 0,
    processing: 0,
    failed: 0,
    completed: 0,
    isConnected: true,
  });
  const [items, setItems] = useState<QueueItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const updateStatus = useCallback(async () => {
    try {
      const queueStatus = await queueProcessor.getQueueStatus();
      const allItems = await queueStorage.getAllItems();

      setStatus(queueStatus);
      setItems(allItems);
    } catch (error) {
      console.error('Error updating queue status:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addToQueue = useCallback(
    async (item: Omit<QueueItem, 'id' | 'createdAt' | 'updatedAt'>) => {
      try {
        const id = await queueProcessor.addToQueue(item);
        await updateStatus();
        return id;
      } catch (error) {
        console.error('Error adding item to queue:', error);
        throw error;
      }
    },
    [updateStatus],
  );

  const retryItem = useCallback(
    async (id: string) => {
      try {
        await queueProcessor.retryItem(id);
        await updateStatus();
      } catch (error) {
        console.error('Error retrying item:', error);
      }
    },
    [updateStatus],
  );

  const cancelItem = useCallback(
    async (id: string) => {
      try {
        await queueProcessor.cancelItem(id);
        await updateStatus();
      } catch (error) {
        console.error('Error canceling item:', error);
      }
    },
    [updateStatus],
  );

  const clearCompleted = useCallback(async () => {
    try {
      await queueProcessor.clearCompleted();
      await updateStatus();
    } catch (error) {
      console.error('Error clearing completed items:', error);
    }
  }, [updateStatus]);

  const forceProcessQueue = useCallback(async () => {
    try {
      await queueProcessor.forceProcessQueue();
      await updateStatus();
    } catch (error) {
      console.error('Error force processing queue:', error);
    }
  }, [updateStatus]);

  // Initialize and set up event listeners
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const initializeQueue = async () => {
      try {
        unsubscribe = await queueProcessor.initialize();
        await updateStatus();

        // Set up event listeners
        queueProcessor.on('item:added', updateStatus);
        queueProcessor.on('item:processing', updateStatus);
        queueProcessor.on('item:completed', updateStatus);
        queueProcessor.on('item:failed', updateStatus);
        queueProcessor.on('network:changed', updateStatus);
      } catch (error) {
        console.error('Error initializing queue:', error);
        setIsLoading(false);
      }
    };

    initializeQueue();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }

      // Remove event listeners
      queueProcessor.removeAllListeners('item:added');
      queueProcessor.removeAllListeners('item:processing');
      queueProcessor.removeAllListeners('item:completed');
      queueProcessor.removeAllListeners('item:failed');
      queueProcessor.removeAllListeners('network:changed');
    };
  }, [updateStatus]);

  return {
    status,
    items,
    isLoading,
    addToQueue,
    retryItem,
    cancelItem,
    clearCompleted,
    forceProcessQueue,
    updateStatus,
  };
}

// Hook for just queue status (lighter weight)
export function useQueueStatus() {
  const [status, setStatus] = useState<QueueStatus>({
    pending: 0,
    processing: 0,
    failed: 0,
    completed: 0,
    isConnected: true,
  });

  const updateStatus = useCallback(async () => {
    try {
      const queueStatus = await queueProcessor.getQueueStatus();
      setStatus(queueStatus);
    } catch (error) {
      console.error('Error updating queue status:', error);
    }
  }, []);

  useEffect(() => {
    updateStatus();

    // Set up event listeners for status changes
    queueProcessor.on('item:added', updateStatus);
    queueProcessor.on('item:processing', updateStatus);
    queueProcessor.on('item:completed', updateStatus);
    queueProcessor.on('item:failed', updateStatus);
    queueProcessor.on('network:changed', updateStatus);

    return () => {
      queueProcessor.removeAllListeners('item:added');
      queueProcessor.removeAllListeners('item:processing');
      queueProcessor.removeAllListeners('item:completed');
      queueProcessor.removeAllListeners('item:failed');
      queueProcessor.removeAllListeners('network:changed');
    };
  }, [updateStatus]);

  return status;
}

// Hook for queue actions without status
export function useQueueActions() {
  const retryItem = useCallback(async (id: string) => {
    await queueProcessor.retryItem(id);
  }, []);

  const cancelItem = useCallback(async (id: string) => {
    await queueProcessor.cancelItem(id);
  }, []);

  const clearCompleted = useCallback(async () => {
    await queueProcessor.clearCompleted();
  }, []);

  const addToQueue = useCallback(
    async (item: Omit<QueueItem, 'id' | 'createdAt' | 'updatedAt'>) => {
      return await queueProcessor.addToQueue(item);
    },
    [],
  );

  return {
    retryItem,
    cancelItem,
    clearCompleted,
    addToQueue,
  };
}
