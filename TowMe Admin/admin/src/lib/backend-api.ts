/**
 * Backend API Client
 * Connects admin app to the TowMe backend API
 */

import type {
  OperatorStatus,
  PaymentStatus,
  RequestInterventionAction,
  RequestStatus,
  SupportCategory,
  SupportPriority,
  SupportStatus,
  UserModerationAction,
} from './contracts';

const API_BASE_URL = import.meta.env.VITE_API_URL;

function getBackendOrigin(): string {
  if (!API_BASE_URL) {
    return '';
  }

  try {
    return new URL(API_BASE_URL).origin;
  } catch {
    return '';
  }
}

export function resolveBackendAssetUrl(url?: string | null): string | null {
  if (!url) {
    return null;
  }

  const trimmed = url.trim();
  if (!trimmed) {
    return null;
  }

  if (/^(https?:|data:|blob:)/i.test(trimmed)) {
    return trimmed;
  }

  if (trimmed.startsWith('//')) {
    return `https:${trimmed}`;
  }

  const normalizedPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  const origin = getBackendOrigin();

  if (origin) {
    return `${origin}${normalizedPath}`;
  }

  if (API_BASE_URL) {
    return `${API_BASE_URL.replace(/\/+$/, '')}${normalizedPath}`;
  }

  return normalizedPath;
}

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
    if (!API_BASE_URL) {
      throw new Error('Missing VITE_API_URL. Backend URL is required.');
    }

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

  async getDashboardRevenueSeries(params?: { days?: number }) {
    const queryParams = new URLSearchParams();
    if (params?.days) queryParams.append('days', params.days.toString());
    const query = queryParams.toString();
    return this.request<Array<{ date: string; revenue: number; trips: number }>>(
      `/admin/stats/revenue-series${query ? `?${query}` : ''}`
    );
  }

  // ============================================================================
  // OPERATORS
  // ============================================================================

  async getOperators(params?: { status?: OperatorStatus; search?: string; page?: number; limit?: number }) {
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

  async updateOperatorStatus(id: string, status: Exclude<OperatorStatus, 'pending'>, notes?: string) {
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
    action: Extract<UserModerationAction, 'soft_ban' | 'permanent_ban' | 'unblock'>,
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

  async getRequests(params?: { status?: RequestStatus; page?: number; limit?: number }) {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const query = queryParams.toString();
    return this.request<any[]>(`/admin/requests${query ? `?${query}` : ''}`);
  }

  async getLiveOperationsSnapshot() {
    return this.request<{
      requests: any[];
      operators: any[];
      updated_at?: string;
    }>('/admin/requests/live');
  }

  async interveneRequest(
    id: string,
    action: RequestInterventionAction,
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

  async getPayments(params?: { status?: PaymentStatus; page?: number; limit?: number }) {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const query = queryParams.toString();
    return this.request<any[]>(`/admin/payments${query ? `?${query}` : ''}`);
  }

  async getPaymentLedger(params?: { type?: string; status?: PaymentStatus; search?: string; page?: number; limit?: number }) {
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

  async processPayout(payoutId: string, payload?: { note?: string }) {
    return this.request<any>(`/admin/finance/payouts/${payoutId}/process`, {
      method: 'POST',
      body: JSON.stringify(payload || {}),
    });
  }

  async retryPayout(payoutId: string, payload?: { note?: string }) {
    return this.request<any>(`/admin/finance/payouts/${payoutId}/retry`, {
      method: 'POST',
      body: JSON.stringify(payload || {}),
    });
  }

  // ============================================================================
  // SUPPORT & DISPUTES
  // ============================================================================

  async getSupportTickets(params?: {
    status?: SupportStatus;
    priority?: SupportPriority;
    category?: SupportCategory;
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
      status?: SupportStatus;
      priority?: SupportPriority;
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
  // NOTIFICATIONS
  // ============================================================================

  async getNotifications(params?: { unreadOnly?: boolean; page?: number; limit?: number }) {
    const queryParams = new URLSearchParams();
    if (params?.unreadOnly) queryParams.append('unread_only', 'true');
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    const query = queryParams.toString();

    return this.request<any[]>(`/admin/notifications${query ? `?${query}` : ''}`);
  }

  async markNotificationRead(id: string) {
    return this.request<any>(`/admin/notifications/${id}/read`, {
      method: 'POST',
    });
  }

  async markAllNotificationsRead() {
    return this.request<any>('/admin/notifications/read-all', {
      method: 'POST',
    });
  }

  async deleteNotification(id: string) {
    return this.request<any>(`/admin/notifications/${id}`, {
      method: 'DELETE',
    });
  }

  async clearNotifications() {
    return this.request<any>('/admin/notifications/clear', {
      method: 'DELETE',
    });
  }

  // ============================================================================
  // SETTINGS & SECURITY
  // ============================================================================

  async getAdminSettings() {
    return this.request<any>('/admin/settings');
  }

  async updateAdminSettings(payload: {
    profile?: {
      name?: string;
      email?: string;
      phone?: string;
      avatar_url?: string | null;
    };
    notifications?: {
      emailNotifications?: boolean;
      pushNotifications?: boolean;
      newOperators?: boolean;
      newRequests?: boolean;
      payments?: boolean;
      systemAlerts?: boolean;
    };
    system?: {
      language?: string;
      timezone?: string;
      currency?: string;
    };
  }) {
    return this.request<any>('/admin/settings', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }

  async changePassword(payload: { currentPassword: string; newPassword: string }) {
    return this.request<any>('/admin/settings/security/password', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateTwoFactor(payload: { enabled: boolean }) {
    return this.request<any>('/admin/settings/security/2fa', {
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

  async getAuditLogs(params?: {
    page?: number;
    limit?: number;
    action?: string;
    search?: string;
    from?: string;
    to?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.action) queryParams.append('action', params.action);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.from) queryParams.append('from', params.from);
    if (params?.to) queryParams.append('to', params.to);
    const query = queryParams.toString();

    return this.request<any[]>(`/admin/audit-logs${query ? `?${query}` : ''}`);
  }
}

// Export singleton instance
export const backendApi = new BackendApi();
export default backendApi;
