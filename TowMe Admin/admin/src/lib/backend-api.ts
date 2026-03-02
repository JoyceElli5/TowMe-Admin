/**
 * Backend API Client
 * Connects admin app to the TowMe backend API
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
  };
}

class BackendApi {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  }

  // ============================================================================
  // AUTH
  // ============================================================================

  async login(email: string, password: string) {
    const response = await this.request<{
      user: { id: string; email: string; role: string };
      token: string;
      refreshToken: string;
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (response.data?.token) {
      this.setToken(response.data.token);
    }

    return response;
  }

  // ============================================================================
  // DASHBOARD
  // ============================================================================

  async getDashboardStats() {
    return this.request<{
      totalOperators: number;
      pendingOperators: number;
      totalUsers: number;
      totalRequests: number;
      activeRequests: number;
      completedRequests: number;
      totalRevenue: number;
    }>('/admin/stats');
  }

  // ============================================================================
  // OPERATORS
  // ============================================================================

  async getOperators(params?: { status?: string; search?: string; page?: number; limit?: number }) {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const query = queryParams.toString();
    return this.request<any[]>(`/admin/operators${query ? `?${query}` : ''}`);
  }

  async getOperator(id: string) {
    return this.request<any>(`/admin/operators/${id}`);
  }

  async updateOperatorStatus(id: string, status: string, notes?: string) {
    return this.request<any>(`/admin/operators/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, notes }),
    });
  }

  // ============================================================================
  // USERS
  // ============================================================================

  async getUsers(params?: { role?: string; search?: string; page?: number; limit?: number }) {
    const queryParams = new URLSearchParams();
    if (params?.role) queryParams.append('role', params.role);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const query = queryParams.toString();
    return this.request<any[]>(`/admin/users${query ? `?${query}` : ''}`);
  }

  async updateUserStatus(id: string, isActive: boolean) {
    return this.request<any>(`/admin/users/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ is_active: isActive }),
    });
  }

  // ============================================================================
  // REQUESTS
  // ============================================================================

  async getRequests(params?: { status?: string; page?: number; limit?: number }) {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const query = queryParams.toString();
    return this.request<any[]>(`/admin/requests${query ? `?${query}` : ''}`);
  }

  // ============================================================================
  // PRICING
  // ============================================================================

  async getPricing() {
    return this.request<any[]>('/admin/pricing');
  }

  async updatePricing(id: string, data: {
    base_fare: number;
    per_km_rate: number;
    minimum_fare: number;
    night_surcharge_percent?: number;
    weekend_surcharge_percent?: number;
  }) {
    return this.request<any>(`/admin/pricing/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // ============================================================================
  // PAYMENTS
  // ============================================================================

  async getPayments(params?: { status?: string; page?: number; limit?: number }) {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const query = queryParams.toString();
    return this.request<any[]>(`/admin/payments${query ? `?${query}` : ''}`);
  }
}

// Export singleton instance
export const backendApi = new BackendApi();
export default backendApi;
