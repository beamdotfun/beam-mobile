import {SyncQueue, SyncResult} from '../../types/offline';
import {api} from '../api';

interface SyncItem {
  id: string;
  success: boolean;
  error?: string;
}

class SyncService {
  async syncItems(items: SyncQueue[]): Promise<{
    successful: number;
    failed: number;
    items: SyncItem[];
    errors: Array<{id: string; error: string}>;
  }> {
    const results: SyncItem[] = [];
    const errors: Array<{id: string; error: string}> = [];
    let successful = 0;
    let failed = 0;

    // Group items by type for batch processing
    const grouped = this.groupByType(items);

    for (const [type, typeItems] of Object.entries(grouped)) {
      const batchResults = await this.syncBatch(type, typeItems);

      for (const result of batchResults) {
        results.push(result);
        if (result.success) {
          successful++;
        } else {
          failed++;
          if (result.error) {
            errors.push({id: result.id, error: result.error});
          }
        }
      }
    }

    return {successful, failed, items: results, errors};
  }

  private groupByType(items: SyncQueue[]): Record<string, SyncQueue[]> {
    return items.reduce((groups, item) => {
      const key = `${item.type}_${item.action}`;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
      return groups;
    }, {} as Record<string, SyncQueue[]>);
  }

  private async syncBatch(
    type: string,
    items: SyncQueue[],
  ): Promise<SyncItem[]> {
    const results: SyncItem[] = [];

    // Handle different sync types
    switch (type) {
      case 'post_create':
        for (const item of items) {
          const result = await this.syncCreatePost(item);
          results.push(result);
        }
        break;

      case 'comment_create':
        for (const item of items) {
          const result = await this.syncCreateComment(item);
          results.push(result);
        }
        break;

      case 'vote_create':
        for (const item of items) {
          const result = await this.syncVote(item);
          results.push(result);
        }
        break;

      case 'follow_create':
      case 'follow_delete':
        for (const item of items) {
          const result = await this.syncFollow(item);
          results.push(result);
        }
        break;

      default:
        // Generic sync for other types
        for (const item of items) {
          const result = await this.syncGeneric(item);
          results.push(result);
        }
    }

    return results;
  }

  private async syncCreatePost(item: SyncQueue): Promise<SyncItem> {
    try {
      const response = await api.post('/posts', item.data);

      if (response.ok) {
        return {id: item.id, success: true};
      } else {
        return {
          id: item.id,
          success: false,
          error: (response.data as any)?.message || 'Failed to create post',
        };
      }
    } catch (error) {
      return {
        id: item.id,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async syncCreateComment(item: SyncQueue): Promise<SyncItem> {
    try {
      const response = await api.post('/comments', item.data);

      if (response.ok) {
        return {id: item.id, success: true};
      } else {
        return {
          id: item.id,
          success: false,
          error: (response.data as any)?.message || 'Failed to create comment',
        };
      }
    } catch (error) {
      return {
        id: item.id,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async syncVote(item: SyncQueue): Promise<SyncItem> {
    try {
      const response = await api.post('/votes', item.data);

      if (response.ok) {
        return {id: item.id, success: true};
      } else {
        return {
          id: item.id,
          success: false,
          error: (response.data as any)?.message || 'Failed to submit vote',
        };
      }
    } catch (error) {
      return {
        id: item.id,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async syncFollow(item: SyncQueue): Promise<SyncItem> {
    try {
      const {targetWallet} = item.data;
      const url = `/users/${targetWallet}/follow`;

      const response =
        item.action === 'create' ? await api.post(url) : await api.delete(url);

      if (response.ok) {
        return {id: item.id, success: true};
      } else {
        return {
          id: item.id,
          success: false,
          error:
            (response.data as any)?.message || 'Failed to update follow status',
        };
      }
    } catch (error) {
      return {
        id: item.id,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async syncGeneric(item: SyncQueue): Promise<SyncItem> {
    try {
      // Generic sync logic based on type and action
      const endpoint = this.getEndpoint(item.type);
      let response;

      switch (item.action) {
        case 'create':
          response = await api.post(endpoint, item.data);
          break;
        case 'update':
          response = await api.put(`${endpoint}/${item.data.id}`, item.data);
          break;
        case 'delete':
          response = await api.delete(`${endpoint}/${item.data.id}`);
          break;
        default:
          throw new Error(`Unknown action: ${item.action}`);
      }

      if (response.ok) {
        return {id: item.id, success: true};
      } else {
        return {
          id: item.id,
          success: false,
          error: (response.data as any)?.message || 'Sync failed',
        };
      }
    } catch (error) {
      return {
        id: item.id,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private getEndpoint(type: string): string {
    const endpoints: Record<string, string> = {
      post: '/posts',
      comment: '/comments',
      vote: '/votes',
      tip: '/tips',
      follow: '/follows',
      brand: '/brands',
      auction: '/auctions',
    };

    return endpoints[type] || `/${type}s`;
  }
}

export const syncService = new SyncService();
