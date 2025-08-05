import {API_CONFIG} from '../../config/api';

// Types
export interface Draft {
  id: number;
  userId: number;
  user: string;
  message: string;
  scheduledFor?: string;
  images?: string[];
  video?: string;
  isThread: boolean;
  threadTitle?: string;
  threadId?: string;
  threadIndex?: number;
  // Legacy field - still supported for backward compatibility
  previousThreadPost?: string;
  quotedPost?: string;
  taggedUsers?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface DraftRequest {
  message?: string;
  scheduledFor?: string;
  images?: string[];
  video?: string;
  isThread?: boolean;
  threadTitle?: string;
  threadId?: string;
  threadIndex?: number;
  // Legacy field - still supported for backward compatibility
  previousThreadPost?: string;
  quotedPost?: string;
  taggedUsers?: string[];
  // New server-side thread creation
  threadDrafts?: {
    title?: string;
    posts: Array<{
      message: string;
      images?: string[];
      video?: string;
      taggedUsers?: string[];
    }>;
  };
}

export interface DraftsResponse {
  success: boolean;
  data: {
    drafts: Draft[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      total_pages: number;
    };
  };
}

export interface DraftResponse {
  success: boolean;
  message: string;
  data: Draft;
}

export interface PublishResponse {
  success: boolean;
  message: string;
  data: {
    signature: string;
    postRequest: any;
  };
}

export interface ApiResponse {
  success: boolean;
  message: string;
}

export interface ThreadDraft {
  threadId: string;
  threadTitle?: string;
  posts: Draft[];
  postCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ThreadsResponse {
  success: boolean;
  data: {
    threads: ThreadDraft[];
    count: number;
  };
}

class DraftsApiService {
  private getAuthHeaders(token: string) {
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  async createDraft(token: string, draft: DraftRequest): Promise<DraftResponse> {
    const response = await fetch(`${API_CONFIG.BASE_URL}/drafts`, {
      method: 'POST',
      headers: this.getAuthHeaders(token),
      body: JSON.stringify(draft),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Failed to create draft: ${response.status}`);
    }

    return response.json();
  }

  async getDrafts(token: string, page = 1, limit = 20): Promise<DraftsResponse> {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}/drafts?page=${page}&limit=${limit}`,
      {
        headers: this.getAuthHeaders(token),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Failed to get drafts: ${response.status}`);
    }

    return response.json();
  }

  async getDraft(token: string, draftId: number): Promise<DraftResponse> {
    const response = await fetch(`${API_CONFIG.BASE_URL}/drafts/${draftId}`, {
      headers: this.getAuthHeaders(token),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Failed to get draft: ${response.status}`);
    }

    return response.json();
  }

  async updateDraft(
    token: string,
    draftId: number,
    updates: Partial<DraftRequest>
  ): Promise<DraftResponse> {
    const response = await fetch(`${API_CONFIG.BASE_URL}/drafts/${draftId}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(token),
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Failed to update draft: ${response.status}`);
    }

    return response.json();
  }

  async deleteDraft(token: string, draftId: number): Promise<ApiResponse> {
    const response = await fetch(`${API_CONFIG.BASE_URL}/drafts/${draftId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(token),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Failed to delete draft: ${response.status}`);
    }

    return response.json();
  }

  async publishDraft(token: string, draftId: number): Promise<PublishResponse> {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}/drafts/${draftId}/publish`,
      {
        method: 'POST',
        headers: this.getAuthHeaders(token),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Failed to publish draft: ${response.status}`);
    }

    return response.json();
  }

  async getScheduledDrafts(token: string): Promise<DraftsResponse> {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}/drafts/scheduled`,
      {
        headers: this.getAuthHeaders(token),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Failed to get scheduled drafts: ${response.status}`);
    }

    return response.json();
  }

  async getThreads(token: string): Promise<ThreadsResponse> {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}/drafts/threads`,
      {
        headers: this.getAuthHeaders(token),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Failed to get thread drafts: ${response.status}`);
    }

    return response.json();
  }
}

export const draftsApi = new DraftsApiService();