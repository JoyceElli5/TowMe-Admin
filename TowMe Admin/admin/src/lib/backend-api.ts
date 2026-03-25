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

  async moderateUser(
    id: string,
    action: 'soft_ban' | 'permanent_ban' | 'unblock',
    payload?: { reason?: string }
  ) {
    return this.request<any>(`/admin/users/${id}/moderation`, {
      method: 'POST',
      body: JSON.stringify({ action, ...(payload || {}) }),
    });
  }

  async resetUserAuth(id: string) {
    return this.request<any>(`/admin/users/${id}/reset-auth`, {
      method: 'POST',
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

  async interveneRequest(
    id: string,
    action: 'cancel' | 'reassign' | 'escalate' | 'mark_fraud' | 'emergency_override',
    payload?: Record<string, unknown>
  ) {
    return this.request<any>(`/admin/requests/${id}/interventions`, {
      method: 'POST',
      body: JSON.stringify({ action, ...(payload || {}) }),
    });
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

  async getPricingVersions(params?: { pricingId?: string; vehicleType?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.pricingId) queryParams.append('pricing_id', params.pricingId);
    if (params?.vehicleType) queryParams.append('vehicle_type', params.vehicleType);
    const query = queryParams.toString();

    return this.request<any[]>(`/admin/pricing/versions${query ? `?${query}` : ''}`);
  }

  async createPricingVersion(
    pricingId: string,
    payload: {
      base_fee: number;
      per_km_rate: number;
      service_fee?: number;
      surge_multiplier?: number;
      zone_multiplier?: number;
      effective_from: string;
      is_active?: boolean;
    }
  ) {
    return this.request<any>(`/admin/pricing/${pricingId}/versions`, {
      method: 'POST',
      body: JSON.stringify(payload),
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

  async getPaymentLedger(params?: { type?: string; status?: string; search?: string; page?: number; limit?: number }) {
    const queryParams = new URLSearchParams();
    if (params?.type) queryParams.append('type', params.type);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const query = queryParams.toString();
    return this.request<any[]>(`/admin/finance/ledger${query ? `?${query}` : ''}`);
  }

  async requestRefund(
    paymentId: string,
    payload: { amount: number; reason?: string }
  ) {
    return this.request<any>(`/admin/finance/refunds`, {
      method: 'POST',
      body: JSON.stringify({ payment_id: paymentId, ...payload }),
    });
  }

  async approveRefund(refundId: string, payload?: { note?: string }) {
    return this.request<any>(`/admin/finance/refunds/${refundId}/approve`, {
      method: 'POST',
      body: JSON.stringify(payload || {}),
    });
  }

  async rejectRefund(refundId: string, payload?: { reason?: string }) {
    return this.request<any>(`/admin/finance/refunds/${refundId}/reject`, {
      method: 'POST',
      body: JSON.stringify(payload || {}),
    });
  }

  // ============================================================================
  // SUPPORT & DISPUTES
  // ============================================================================

  async getSupportTickets(params?: {
    status?: string;
    priority?: string;
    category?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.priority) queryParams.append('priority', params.priority);
    if (params?.category) queryParams.append('category', params.category);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const query = queryParams.toString();
    return this.request<any[]>(`/admin/support/tickets${query ? `?${query}` : ''}`);
  }

  async updateSupportTicket(
    ticketId: string,
    payload: {
      status?: 'open' | 'in_progress' | 'resolved' | 'closed';
      priority?: 'low' | 'medium' | 'high' | 'urgent';
      assigned_to?: string;
      assigned_to_name?: string;
      sla_due_at?: string;
      resolution_summary?: string;
    }
  ) {
    return this.request<any>(`/admin/support/tickets/${ticketId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }

  async addSupportReply(
    ticketId: string,
    payload: {
      message: string;
      is_internal?: boolean;
      author_id?: string;
    }
  ) {
    return this.request<any>(`/admin/support/tickets/${ticketId}/replies`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async resolveDispute(
    disputeId: string,
    payload: {
      decision: 'approve_refund' | 'reject_claim' | 'partial_refund' | 'operator_penalty' | 'no_action';
      note?: string;
      refund_amount?: number;
    }
  ) {
    return this.request<any>(`/admin/support/disputes/${disputeId}/resolve`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // ============================================================================
  // AUDIT LOGGING
  // ============================================================================

  async logAuditEvent(payload: {
    action: string;
    resourceType: string;
    resourceId: string;
    timestamp: string;
    before?: unknown;
    after?: unknown;
    metadata?: Record<string, unknown>;
  }) {
    return this.request<any>('/admin/audit-logs', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }
}

// Export singleton instance
export const backendApi = new BackendApi();
export default backendApi;
