import {API_CONFIG} from '../../config/api';

export interface Receipt {
  receiptId: number;
  signature: string;
  categoryId?: number;
  category?: {
    id: number;
    name: string;
    description: string;
    color: string;
    icon: string;
    isDefault: boolean;
  };
  notes?: string;
  createdAt: string;
  postFound: boolean;
  post?: {
    signature?: string;
    message?: string;
    user?: string;
    userInfo?: {
      id: number;
      name: string;
      email: string;
    };
    receiptsCount?: number;
    viewCount?: number;
    createdAt?: string;
    // New API structure fields
    postSignature?: string;
    postMessage?: string;
    postUser?: string;
    displayName?: string;
    userReputation?: number;
    userIsVerifiedNft?: boolean;
    userIsVerifiedSns?: boolean;
    userIsBrand?: boolean;
    [key: string]: any; // Allow other fields from the flattened structure
  };
}

export interface ReceiptsResponse {
  success: boolean;
  data: {
    data: {
      receipts: Receipt[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        total_pages: number;
      };
    };
    success: boolean;
  } | {
    // Backward compatibility for flat structure
    receipts: Receipt[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      total_pages: number;
    };
  };
}

export interface AddReceiptResponse {
  success: boolean;
  message: string;
  data: {
    receiptId: number;
    signature: string;
  };
}

export interface CheckReceiptResponse {
  success: boolean;
  data: {
    signature: string;
    isReceipted: boolean;
  };
}

export interface ReceiptCategory {
  id: number;
  name: string;
  description: string;
  color: string;
  icon: string;
  isDefault: boolean;
  sortOrder: number;
  receiptCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CategoriesResponse {
  success: boolean;
  data: ReceiptCategory[];
}

export interface CreateCategoryRequest {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  sortOrder?: number;
}

export interface UpdateCategoryRequest {
  name?: string;
  description?: string;
  color?: string;
  icon?: string;
  sortOrder?: number;
}

export interface ApiResponse {
  success: boolean;
  message: string;
  data?: any;
}

class ReceiptsApiService {
  private getAuthHeaders(token: string) {
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  // Receipts Management
  async getUserReceipts(
    token: string,
    page: number = 1,
    limit: number = 20,
    categoryId?: string
  ): Promise<ReceiptsResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (categoryId) {
      params.append('categoryId', categoryId);
    }

    const response = await fetch(`${API_CONFIG.BASE_URL}/receipts?${params}`, {
      method: 'GET',
      headers: this.getAuthHeaders(token),
    });

    if (!response.ok) {
      throw new Error(`Failed to get receipts: ${response.status}`);
    }

    return response.json();
  }

  async addReceipt(
    token: string,
    signature: string,
    categoryId?: number,
    notes?: string
  ): Promise<AddReceiptResponse> {
    const response = await fetch(`${API_CONFIG.BASE_URL}/receipts`, {
      method: 'POST',
      headers: this.getAuthHeaders(token),
      body: JSON.stringify({
        signature,
        categoryId,
        notes,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Failed to add receipt: ${response.status}`);
    }

    return response.json();
  }

  async updateReceipt(
    token: string,
    signature: string,
    categoryId?: number,
    notes?: string
  ): Promise<ApiResponse> {
    const response = await fetch(`${API_CONFIG.BASE_URL}/receipts/${signature}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(token),
      body: JSON.stringify({
        categoryId,
        notes,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Failed to update receipt: ${response.status}`);
    }

    return response.json();
  }

  async removeReceipt(token: string, signature: string): Promise<ApiResponse> {
    const response = await fetch(`${API_CONFIG.BASE_URL}/receipts/${signature}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(token),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Failed to remove receipt: ${response.status}`);
    }

    return response.json();
  }

  async checkReceipt(token: string, signature: string): Promise<CheckReceiptResponse> {
    const response = await fetch(`${API_CONFIG.BASE_URL}/receipts/${signature}/check`, {
      method: 'GET',
      headers: this.getAuthHeaders(token),
    });

    if (!response.ok) {
      throw new Error(`Failed to check receipt: ${response.status}`);
    }

    return response.json();
  }

  async checkMultipleReceipts(token: string, signatures: string[]): Promise<Record<string, boolean>> {
    const response = await fetch(`${API_CONFIG.BASE_URL}/receipts/batch/check`, {
      method: 'POST',
      headers: this.getAuthHeaders(token),
      body: JSON.stringify({ signatures }),
    });

    if (!response.ok) {
      throw new Error(`Failed to check multiple receipts: ${response.status}`);
    }

    const result = await response.json();
    // Handle nested response structure: result.data.data.receipts or result.data.receipts
    const responseData = result.data?.data || result.data;
    return responseData?.receipts || {};
  }

  // Category Management
  async getCategories(token: string): Promise<CategoriesResponse> {
    const response = await fetch(`${API_CONFIG.BASE_URL}/receipts/categories`, {
      method: 'GET',
      headers: this.getAuthHeaders(token),
    });

    if (!response.ok) {
      throw new Error(`Failed to get categories: ${response.status}`);
    }

    return response.json();
  }

  async createCategory(
    token: string,
    categoryData: CreateCategoryRequest
  ): Promise<ApiResponse> {
    const response = await fetch(`${API_CONFIG.BASE_URL}/receipts/categories`, {
      method: 'POST',
      headers: this.getAuthHeaders(token),
      body: JSON.stringify(categoryData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Failed to create category: ${response.status}`);
    }

    return response.json();
  }

  async getCategory(token: string, categoryId: number): Promise<{
    success: boolean;
    data: ReceiptCategory;
  }> {
    const response = await fetch(`${API_CONFIG.BASE_URL}/receipts/categories/${categoryId}`, {
      method: 'GET',
      headers: this.getAuthHeaders(token),
    });

    if (!response.ok) {
      throw new Error(`Failed to get category: ${response.status}`);
    }

    return response.json();
  }

  async updateCategory(
    token: string,
    categoryId: number,
    updates: UpdateCategoryRequest
  ): Promise<ApiResponse> {
    const response = await fetch(`${API_CONFIG.BASE_URL}/receipts/categories/${categoryId}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(token),
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Failed to update category: ${response.status}`);
    }

    return response.json();
  }

  async deleteCategory(token: string, categoryId: number): Promise<ApiResponse> {
    const response = await fetch(`${API_CONFIG.BASE_URL}/receipts/categories/${categoryId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(token),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Failed to delete category: ${response.status}`);
    }

    return response.json();
  }

}

export const receiptsApi = new ReceiptsApiService();