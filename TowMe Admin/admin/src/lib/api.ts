import { supabase, isDemoMode } from './supabase';
import { backendApi, resolveBackendAssetUrl } from './backend-api';
import type {
  Operator,
  AppUser,
  Notification,
  AdminSettings,
  RevenuePoint,
  AuditLogRecord,
  SupportTicket,
  TowRequest,
  PricingConfig,
  PricingVersion,
  RequestInterventionAction,
  UserModerationAction,
} from '../types';
import {
  OPERATOR_STATUSES,
  PAYMENT_STATUSES,
  REQUEST_STATUSES,
  SUPPORT_PRIORITIES,
  SUPPORT_STATUSES,
} from './contracts';
import type {
  OperatorStatus,
  PaymentStatus,
  SupportPriority,
  SupportStatus,
} from './contracts';

const REQUEST_STATUS = {
  pending: REQUEST_STATUSES[0],
  accepted: REQUEST_STATUSES[1],
  enRoute: REQUEST_STATUSES[2],
  arrived: REQUEST_STATUSES[3],
  inProgress: REQUEST_STATUSES[4],
  completed: REQUEST_STATUSES[5],
  cancelled: REQUEST_STATUSES[6],
} as const;

const OPERATOR_STATUS = {
  pending: OPERATOR_STATUSES[0],
  approved: OPERATOR_STATUSES[1],
  rejected: OPERATOR_STATUSES[2],
  suspended: OPERATOR_STATUSES[3],
} as const;

const SUPPORT_STATUS = {
  open: SUPPORT_STATUSES[0],
  inProgress: SUPPORT_STATUSES[1],
  resolved: SUPPORT_STATUSES[2],
  closed: SUPPORT_STATUSES[3],
} as const;

const SUPPORT_PRIORITY = {
  low: SUPPORT_PRIORITIES[0],
  medium: SUPPORT_PRIORITIES[1],
  high: SUPPORT_PRIORITIES[2],
  urgent: SUPPORT_PRIORITIES[3],
} as const;

function backendFlowError(context: string, error?: unknown): Error {
  const details = error instanceof Error ? error.message : String(error || 'unknown error');
  return new Error(`${context}. Backend flow is required. Details: ${details}`);
}
function getDefaultAdminSettings(): AdminSettings {
  return {
    profile: {
      name: 'Admin User',
      email: 'admin@towme.com',
      phone: '',
      avatar_url: null,
    },
    notifications: {
      emailNotifications: true,
      pushNotifications: true,
      newOperators: true,
      newRequests: true,
      payments: true,
      systemAlerts: true,
    },
    system: {
      language: 'English',
      timezone: 'Africa/Accra',
      currency: 'GHS',
    },
  };
}

function readFromStorage(key: string): string | null {
  if (typeof localStorage === 'undefined') {
    return null;
  }

  return localStorage.getItem(key);
}

function writeToStorage(key: string, value: string): void {
  if (typeof localStorage === 'undefined') {
    return;
  }

  localStorage.setItem(key, value);
}

// ============================================================================
// DEMO DATA - Used when Supabase is not configured
// ============================================================================
const demoOperators: Operator[] = [
  {
    id: '1',
    user_id: 'user-1',
    full_name: 'Kofi Mensah',
    email: 'kofi.mensah@email.com',
    phone: '+233 24 567 8901',
    status: 'pending',
    profile_photo_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Kofi',
    ghana_card_url: '/documents/ghana-card-1.jpg',
    drivers_license_url: '/documents/license-1.jpg',
    vehicle_registration_url: '/documents/reg-1.jpg',
    insurance_url: '/documents/insurance-1.jpg',
    rating: 0,
    total_trips: 0,
    earnings: 0,
    is_online: false,
    created_at: '2026-02-04T10:30:00Z',
    updated_at: '2026-02-04T10:30:00Z',
  },
  {
    id: '2',
    user_id: 'user-2',
    full_name: 'Ama Serwaa',
    email: 'ama.serwaa@email.com',
    phone: '+233 20 123 4567',
    status: 'pending',
    profile_photo_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ama',
    ghana_card_url: '/documents/ghana-card-2.jpg',
    drivers_license_url: '/documents/license-2.jpg',
    vehicle_registration_url: '/documents/reg-2.jpg',
    insurance_url: '/documents/insurance-2.jpg',
    rating: 0,
    total_trips: 0,
    earnings: 0,
    is_online: false,
    created_at: '2026-02-03T14:20:00Z',
    updated_at: '2026-02-03T14:20:00Z',
  },
  {
    id: '3',
    user_id: 'user-3',
    full_name: 'Kwame Asante',
    email: 'kwame.asante@email.com',
    phone: '+233 27 890 1234',
    status: 'approved',
    profile_photo_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Kwame',
    ghana_card_url: '/documents/ghana-card-3.jpg',
    drivers_license_url: '/documents/license-3.jpg',
    vehicle_registration_url: '/documents/reg-3.jpg',
    insurance_url: '/documents/insurance-3.jpg',
    rating: 4.8,
    total_trips: 156,
    earnings: 12500,
    is_online: true,
    current_location: { latitude: 5.6037, longitude: -0.1870 },
    created_at: '2026-01-15T08:00:00Z',
    updated_at: '2026-02-05T09:00:00Z',
  },
  {
    id: '4',
    user_id: 'user-4',
    full_name: 'Abena Owusu',
    email: 'abena.owusu@email.com',
    phone: '+233 55 678 9012',
    status: 'approved',
    profile_photo_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Abena',
    ghana_card_url: '/documents/ghana-card-4.jpg',
    drivers_license_url: '/documents/license-4.jpg',
    vehicle_registration_url: '/documents/reg-4.jpg',
    insurance_url: '/documents/insurance-4.jpg',
    rating: 4.5,
    total_trips: 89,
    earnings: 7200,
    is_online: false,
    created_at: '2026-01-20T11:30:00Z',
    updated_at: '2026-02-04T16:00:00Z',
  },
  {
    id: '5',
    user_id: 'user-5',
    full_name: 'Samuel Ofori',
    email: 'samuel.ofori@email.com',
    phone: '+233 24 111 2222',
    status: 'rejected',
    profile_photo_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Samuel',
    ghana_card_url: '/documents/ghana-card-5.jpg',
    drivers_license_url: '/documents/license-5.jpg',
    vehicle_registration_url: '/documents/reg-5.jpg',
    insurance_url: '/documents/insurance-5.jpg',
    rating: 0,
    total_trips: 0,
    earnings: 0,
    is_online: false,
    created_at: '2026-02-01T09:00:00Z',
    updated_at: '2026-02-02T14:00:00Z',
  },
];

const demoUsers: AppUser[] = [
  {
    id: '1',
    email: 'john.doe@email.com',
    phone: '+233 24 111 1111',
    full_name: 'John Doe',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
    role: 'user',
    is_active: true,
    total_trips: 12,
    created_at: '2026-01-10T08:00:00Z',
    last_login: '2026-02-05T07:30:00Z',
  },
  {
    id: '2',
    email: 'mary.mensah@email.com',
    phone: '+233 20 222 2222',
    full_name: 'Mary Mensah',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mary',
    role: 'user',
    is_active: true,
    total_trips: 8,
    created_at: '2026-01-15T10:00:00Z',
    last_login: '2026-02-04T18:00:00Z',
  },
  {
    id: '3',
    email: 'peter.addo@email.com',
    phone: '+233 55 333 3333',
    full_name: 'Peter Addo',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Peter',
    role: 'user',
    is_active: false,
    total_trips: 3,
    created_at: '2026-01-20T14:00:00Z',
    last_login: '2026-01-28T12:00:00Z',
  },
];

const demoRequests: TowRequest[] = [
  {
    id: '1',
    user_id: '1',
    user_name: 'John Doe',
    user_phone: '+233 24 111 1111',
    operator_id: '3',
    operator_name: 'Kwame Asante',
    pickup_location: {
      address: 'Accra Mall, Spintex Road',
      latitude: 5.6350,
      longitude: -0.1456,
    },
    destination: {
      address: 'Tema Community 1',
      latitude: 5.6698,
      longitude: -0.0166,
    },
    vehicle_type: 'Saloon',
    status: 'in_progress',
    estimated_price: 120,
    final_price: undefined,
    distance_km: 15.2,
    created_at: '2026-02-05T08:30:00Z',
    accepted_at: '2026-02-05T08:35:00Z',
    started_at: '2026-02-05T08:50:00Z',
  },
  {
    id: '2',
    user_id: '2',
    user_name: 'Mary Mensah',
    user_phone: '+233 20 222 2222',
    operator_id: '4',
    operator_name: 'Abena Owusu',
    pickup_location: {
      address: 'East Legon, American House',
      latitude: 5.6381,
      longitude: -0.1520,
    },
    destination: {
      address: 'Madina Market',
      latitude: 5.6830,
      longitude: -0.1750,
    },
    vehicle_type: 'SUV',
    status: 'completed',
    estimated_price: 85,
    final_price: 90,
    distance_km: 8.5,
    created_at: '2026-02-05T06:00:00Z',
    accepted_at: '2026-02-05T06:05:00Z',
    started_at: '2026-02-05T06:20:00Z',
    completed_at: '2026-02-05T06:55:00Z',
  },
  {
    id: '3',
    user_id: '3',
    user_name: 'Peter Addo',
    user_phone: '+233 55 333 3333',
    pickup_location: {
      address: 'Osu, Oxford Street',
      latitude: 5.5571,
      longitude: -0.1818,
    },
    destination: {
      address: 'Airport Residential',
      latitude: 5.6052,
      longitude: -0.1681,
    },
    vehicle_type: 'Saloon',
    status: 'pending',
    estimated_price: 150,
    final_price: undefined,
    distance_km: 6.8,
    created_at: '2026-02-05T09:00:00Z',
  },
  {
    id: '4',
    user_id: '1',
    user_name: 'John Doe',
    user_phone: '+233 24 111 1111',
    operator_id: '3',
    operator_name: 'Kwame Asante',
    pickup_location: {
      address: 'Tema Motorway Roundabout',
      latitude: 5.6236,
      longitude: -0.0883,
    },
    destination: {
      address: 'Circle, Kwame Nkrumah Interchange',
      latitude: 5.5724,
      longitude: -0.2121,
    },
    vehicle_type: 'Truck',
    status: 'cancelled',
    estimated_price: 200,
    final_price: undefined,
    distance_km: 18.5,
    created_at: '2026-02-04T14:00:00Z',
    cancelled_at: '2026-02-04T14:15:00Z',
    cancellation_reason: 'Customer found alternative transport',
  },
];

const demoPricing: PricingConfig[] = [
  { id: '1', vehicle_type: 'Motorcycle', base_fee: 20, per_km_rate: 3, service_fee: 2, surge_multiplier: 1, zone_multiplier: 1, effective_from: '2026-01-01T00:00:00Z', is_active: true },
  { id: '2', vehicle_type: 'Saloon', base_fee: 50, per_km_rate: 5, service_fee: 5, surge_multiplier: 1, zone_multiplier: 1, effective_from: '2026-01-01T00:00:00Z', is_active: true },
  { id: '3', vehicle_type: 'SUV', base_fee: 60, per_km_rate: 6, service_fee: 6, surge_multiplier: 1, zone_multiplier: 1, effective_from: '2026-01-01T00:00:00Z', is_active: true },
  { id: '4', vehicle_type: 'Van', base_fee: 70, per_km_rate: 7, service_fee: 7, surge_multiplier: 1, zone_multiplier: 1, effective_from: '2026-01-01T00:00:00Z', is_active: true },
  { id: '5', vehicle_type: 'Truck', base_fee: 100, per_km_rate: 10, service_fee: 10, surge_multiplier: 1, zone_multiplier: 1, effective_from: '2026-01-01T00:00:00Z', is_active: true },
];

const demoPricingVersions: PricingVersion[] = demoPricing.map((pricing) => ({
  id: `pv-${pricing.id}-initial`,
  pricing_id: pricing.id,
  vehicle_type: pricing.vehicle_type,
  base_fee: pricing.base_fee,
  per_km_rate: pricing.per_km_rate,
  service_fee: pricing.service_fee,
  surge_multiplier: pricing.surge_multiplier,
  zone_multiplier: pricing.zone_multiplier,
  effective_from: pricing.effective_from || '2026-01-01T00:00:00Z',
  changed_at: '2026-01-01T00:00:00Z',
  changed_by: 'system',
}));

export interface FinanceLedgerEntry {
  id: string;
  type: 'payment' | 'refund' | 'payout';
  amount: number;
  status: Extract<PaymentStatus, 'completed' | 'pending' | 'failed'>;
  requestId: string;
  userId?: string;
  operatorId?: string;
  userName: string;
  operatorName: string;
  method: string;
  date: string;
  relatedPaymentId?: string;
  reason?: string;
}

export interface WalletBalanceEntry {
  operatorKey: string;
  operatorName: string;
  totalPayments: number;
  totalPayouts: number;
  totalRefundAdjustments: number;
  balance: number;
}

// ============================================================================
// API FUNCTIONS - Returns demo data or real Supabase data
// ============================================================================

// Operators API
export const operatorsApi = {
  canTransitionStatus(
    currentStatus: Operator['status'],
    nextStatus: Exclude<OperatorStatus, 'pending'>
  ): boolean {
    const allowedTransitions: Record<Operator['status'], Array<Exclude<OperatorStatus, 'pending'>>> = {
      pending: ['approved', 'rejected'],
      approved: ['suspended'],
      suspended: ['approved'],
      rejected: [],
    };

    return allowedTransitions[currentStatus].includes(nextStatus);
  },

  async getAll(): Promise<Operator[]> {
    // Try backend API first
    try {
      const response = await backendApi.getOperators();
      if (response.success && response.data) {
        return response.data.map((op: any) => ({
          id: op.id || op.user_id,
          user_id: op.user_id,
          full_name: op.full_name,
          email: op.email,
          phone: op.phone,
          status: op.status || OPERATOR_STATUSES[0],
          profile_photo_url: resolveBackendAssetUrl(op.profile_photo_url) || undefined,
          ghana_card_url:
            resolveBackendAssetUrl(op.documents?.find((d: any) => d.document_type === 'ghana_card')?.document_url) || undefined,
          drivers_license_url:
            resolveBackendAssetUrl(op.documents?.find((d: any) => d.document_type === 'drivers_license')?.document_url) || undefined,
          vehicle_registration_url:
            resolveBackendAssetUrl(op.documents?.find((d: any) => d.document_type === 'vehicle_registration')?.document_url) || undefined,
          insurance_url:
            resolveBackendAssetUrl(op.documents?.find((d: any) => d.document_type === 'insurance')?.document_url) || undefined,
          rating: op.rating || 0,
          total_trips: op.total_trips || 0,
          earnings: op.earnings || 0,
          is_online: op.is_online || false,
          created_at: op.created_at,
          updated_at: op.updated_at,
        }));
      }
    } catch (error) {
      console.warn('Backend operators request failed, falling back to Supabase.', error);
    }

    // Fallback to demo data
    if (isDemoMode) {
      return demoOperators;
    }
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'tow_operator')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return data.map(user => ({
      id: user.id,
      user_id: user.id,
      full_name: user.full_name,
      email: user.email,
      phone: user.phone,
      status: user.verification_status || OPERATOR_STATUSES[0],
      profile_photo_url: resolveBackendAssetUrl(user.operator_photo_url || user.avatar_url) || undefined,
      ghana_card_url: resolveBackendAssetUrl(user.ghana_card_photo_url) || undefined,
      drivers_license_url: resolveBackendAssetUrl(user.drivers_license_photo_url) || undefined,
      vehicle_registration_url: resolveBackendAssetUrl(user.vehicle_registration_photo_url) || undefined,
      insurance_url: resolveBackendAssetUrl(user.insurance_photo_url) || undefined,
      rating: user.average_rating || 0,
      total_trips: user.total_trips || 0,
      earnings: 0,
      is_online: user.is_online || false,
      created_at: user.created_at,
      updated_at: user.updated_at,
    }));
  },

  async getById(id: string): Promise<Operator | null> {
    if (isDemoMode) {
      return demoOperators.find(op => op.id === id) || null;
    }
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    if (!data) return null;
    
    return {
      id: data.id,
      user_id: data.id,
      full_name: data.full_name,
      email: data.email,
      phone: data.phone,
      status: data.verification_status || OPERATOR_STATUSES[0],
      profile_photo_url: resolveBackendAssetUrl(data.operator_photo_url || data.avatar_url) || undefined,
      ghana_card_url: resolveBackendAssetUrl(data.ghana_card_photo_url) || undefined,
      drivers_license_url: resolveBackendAssetUrl(data.drivers_license_photo_url) || undefined,
      vehicle_registration_url: resolveBackendAssetUrl(data.vehicle_registration_photo_url) || undefined,
      insurance_url: resolveBackendAssetUrl(data.insurance_photo_url) || undefined,
      rating: data.average_rating || 0,
      total_trips: data.total_trips || 0,
      earnings: 0,
      is_online: data.is_online || false,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  },

  async updateStatus(
    id: string,
    status: Exclude<OperatorStatus, 'pending'>,
    currentStatus?: Operator['status']
  ): Promise<void> {
    if (currentStatus && !this.canTransitionStatus(currentStatus, status)) {
      throw new Error(`Invalid operator status transition: ${currentStatus} -> ${status}`);
    }

    // Try backend API first
    try {
      const response = await backendApi.updateOperatorStatus(id, status);
      if (response.success) {
        return;
      }
    } catch (error) {
      console.warn('Backend operator status update failed, falling back to Supabase.', error);
    }

    if (isDemoMode) {
      return;
    }
    
    const { error } = await supabase
      .from('users')
      .update({ 
        verification_status: status,
        is_verified: status === 'approved',
        updated_at: new Date().toISOString()
      })
      .eq('id', id);
    
    if (error) throw error;
  },

  async getPendingCount(): Promise<number> {
    if (isDemoMode) {
      return demoOperators.filter((op) => op.status === OPERATOR_STATUS.pending).length;
    }
    
    const { count, error } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'tow_operator')
      .eq('verification_status', OPERATOR_STATUS.pending);
    
    if (error) throw error;
    return count || 0;
  },
};

// Users API
export const usersApi = {
  canModerate(user: AppUser, action: UserModerationAction, isSuperAdmin = false): boolean {
    switch (action) {
      case 'soft_ban':
        return user.moderation_status !== 'permanently_banned' && user.moderation_status !== 'soft_banned';
      case 'permanent_ban':
        return user.moderation_status !== 'permanently_banned';
      case 'unblock':
        if (user.moderation_status === 'permanently_banned' && !isSuperAdmin) {
          return false;
        }
        return user.moderation_status === 'soft_banned' || user.moderation_status === 'permanently_banned' || !user.is_active;
      case 'reset_auth':
        return true;
      default:
        return false;
    }
  },

  async getAll(): Promise<AppUser[]> {
    // Try backend API first
    try {
      const response = await backendApi.getUsers();
      if (response.success && response.data) {
        return response.data.map((user: any) => ({
          id: user.id,
          email: user.email,
          phone: user.phone,
          full_name: user.full_name,
          avatar_url: resolveBackendAssetUrl(user.avatar_url) || undefined,
          role: user.role || 'user',
          is_active: user.is_active !== false,
          moderation_status:
            user.moderation_status ||
            (user.is_active === false ? 'soft_banned' : 'active'),
          ban_reason: user.ban_reason,
          banned_at: user.banned_at,
          total_trips: user.total_trips || 0,
          created_at: user.created_at,
          last_login: user.last_login,
        }));
      }
    } catch (error) {
      console.warn('Backend users request failed, falling back to Supabase.', error);
    }

    if (isDemoMode) {
      return demoUsers;
    }
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'vehicle_owner')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return data.map(user => ({
      id: user.id,
      email: user.email,
      phone: user.phone,
      full_name: user.full_name,
      avatar_url: resolveBackendAssetUrl(user.avatar_url) || undefined,
      role: 'user',
      is_active: user.is_verified || true,
      moderation_status: user.is_active === false ? 'soft_banned' : 'active',
      ban_reason: user.ban_reason,
      banned_at: user.banned_at,
      total_trips: user.total_trips || 0,
      created_at: user.created_at,
      last_login: user.updated_at,
    }));
  },

  async moderate(
    userId: string,
    action: Extract<UserModerationAction, 'soft_ban' | 'permanent_ban' | 'unblock'>,
    payload?: { reason?: string }
  ): Promise<void> {
    try {
      const response = await backendApi.moderateUser(userId, action, payload);
      if (response.success) {
        return;
      }
    } catch (error) {
      console.warn('Backend user moderation failed, falling back to Supabase.', error);
    }

    if (isDemoMode) {
      return;
    }

    const isActive = action === 'unblock';
    const { error } = await supabase
      .from('users')
      .update({
        is_active: isActive,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) throw error;
  },

  async resetAuth(userId: string): Promise<void> {
    try {
      const response = await backendApi.resetUserAuth(userId);
      if (response.success) {
        return;
      }
    } catch (error) {
      console.warn('Backend reset auth failed, using local fallback.', error);
    }

    if (isDemoMode) {
      return;
    }

    throw new Error('Reset auth requires backend endpoint support.');
  },

  async getCount(): Promise<number> {
    if (isDemoMode) {
      return demoUsers.length;
    }
    
    const { count, error } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'vehicle_owner');
    
    if (error) throw error;
    return count || 0;
  },
};

// Requests API
export const requestsApi = {
  canIntervene(request: TowRequest, action: RequestInterventionAction): boolean {
    switch (action) {
      case 'cancel':
        return request.status !== 'completed' && request.status !== 'cancelled';
      case 'reassign':
        return REQUEST_STATUSES.slice(0, 5).includes(request.status);
      case 'escalate':
      case 'mark_fraud':
      case 'emergency_override':
        return request.status !== 'completed';
      default:
        return false;
    }
  },

  async getAll(): Promise<TowRequest[]> {
    // Try backend API first
    try {
      const response = await backendApi.getRequests();
      if (response.success && response.data) {
        return response.data.map((req: any) => ({
          id: req.id,
          user_id: req.user_id,
          user_name: req.user_name || 'Unknown',
          user_phone: req.user_phone || '',
          operator_id: req.operator_id,
          operator_name: req.operator_name,
          pickup_location: {
            address: req.pickup_address || req.pickup_location?.address || 'Unknown pickup',
            latitude: Number(req.pickup_lat ?? req.pickup_location?.latitude ?? 0),
            longitude: Number(req.pickup_lng ?? req.pickup_location?.longitude ?? 0),
          },
          destination: {
            address: req.dropoff_address || req.destination?.address || 'Unknown destination',
            latitude: Number(req.dropoff_lat ?? req.destination?.latitude ?? 0),
            longitude: Number(req.dropoff_lng ?? req.destination?.longitude ?? 0),
          },
          vehicle_type: req.vehicle_type,
          status: req.status,
          estimated_price: Number(req.estimated_price || 0),
          final_price: req.final_price,
          distance_km: Number(req.distance_km || 0),
          created_at: req.created_at,
          accepted_at: req.accepted_at,
          started_at: req.started_at,
          completed_at: req.completed_at,
          cancelled_at: req.cancelled_at,
          cancellation_reason: req.cancellation_reason,
          is_escalated: req.is_escalated,
          escalated_at: req.escalated_at,
          is_fraud_suspected: req.is_fraud_suspected,
          emergency_override: req.emergency_override,
          intervention_notes: req.intervention_notes,
          eta_minutes: req.eta_minutes,
          route_progress_percent: req.route_progress_percent,
          operator_location: req.operator_location
            ? {
                latitude: Number(req.operator_location.latitude),
                longitude: Number(req.operator_location.longitude),
                heading: req.operator_location.heading,
                speed_kmh: req.operator_location.speed_kmh,
                updated_at: req.operator_location.updated_at,
              }
            : undefined,
        }));
      }
    } catch (error) {
      console.warn('Backend requests fetch failed, falling back to Supabase.', error);
    }

    if (isDemoMode) {
      return demoRequests;
    }
    
    const { data, error } = await supabase
      .from('towing_requests')
      .select(`
        *,
        user:user_id(full_name, phone),
        operator:operator_id(full_name, phone)
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return data.map(req => ({
      id: req.id,
      user_id: req.user_id,
      user_name: req.user?.full_name || 'Unknown',
      user_phone: req.user?.phone || '',
      operator_id: req.operator_id,
      operator_name: req.operator?.full_name,
      pickup_location: {
        address: req.pickup_address,
        latitude: req.pickup_lat,
        longitude: req.pickup_lng,
      },
      destination: {
        address: req.destination_address,
        latitude: req.destination_lat,
        longitude: req.destination_lng,
      },
      vehicle_type: req.vehicle_type,
      status: req.status,
      estimated_price: req.estimated_price,
      final_price: req.final_price,
      distance_km: req.distance_km,
      created_at: req.created_at,
      accepted_at: req.accepted_at,
      started_at: req.started_at,
      completed_at: req.completed_at,
      cancelled_at: req.cancelled_at,
      cancellation_reason: req.cancellation_reason,
      is_escalated: req.is_escalated,
      escalated_at: req.escalated_at,
      is_fraud_suspected: req.is_fraud_suspected,
      emergency_override: req.emergency_override,
      intervention_notes: req.intervention_notes,
    }));
  },

  async intervene(
    requestId: string,
    action: RequestInterventionAction,
    payload?: {
      reason?: string;
      note?: string;
      operator_id?: string;
      operator_name?: string;
    }
  ): Promise<void> {
    try {
      const response = await backendApi.interveneRequest(requestId, action, payload);
      if (response.success) {
        return;
      }
    } catch (error) {
      console.warn('Backend request intervention failed, falling back to Supabase.', error);
    }

    if (isDemoMode) {
      return;
    }

    if (action === 'cancel') {
      const { error } = await supabase
        .from('towing_requests')
        .update({
          status: REQUEST_STATUSES[6],
          cancelled_at: new Date().toISOString(),
          cancellation_reason: payload?.reason || 'Cancelled by admin',
        })
        .eq('id', requestId);

      if (error) throw error;
      return;
    }

    if (action === 'reassign') {
      const { error } = await supabase
        .from('towing_requests')
        .update({
          operator_id: payload?.operator_id || null,
        })
        .eq('id', requestId);

      if (error) throw error;
      return;
    }

    throw new Error('Intervention action requires backend endpoint support.');
  },

  async getStats(): Promise<{ pending: number; inProgress: number; completed: number; cancelled: number; totalRevenue: number }> {
    if (isDemoMode) {
      return {
        pending: demoRequests.filter(r => r.status === REQUEST_STATUS.pending).length,
        inProgress: demoRequests.filter(r => r.status === REQUEST_STATUS.inProgress).length,
        completed: demoRequests.filter(r => r.status === REQUEST_STATUS.completed).length,
        cancelled: demoRequests.filter(r => r.status === REQUEST_STATUS.cancelled).length,
        totalRevenue: demoRequests
          .filter(r => r.final_price)
          .reduce((sum, r) => sum + (r.final_price || 0), 0),
      };
    }
    
    const { data, error } = await supabase
      .from('towing_requests')
      .select('status, final_price');
    
    if (error) throw error;
    
    return {
      pending: data.filter(r => r.status === REQUEST_STATUS.pending).length,
      inProgress: data.filter(r => r.status === REQUEST_STATUS.inProgress).length,
      completed: data.filter(r => r.status === REQUEST_STATUS.completed).length,
      cancelled: data.filter(r => r.status === REQUEST_STATUS.cancelled).length,
      totalRevenue: data
        .filter(r => r.final_price)
        .reduce((sum, r) => sum + (r.final_price || 0), 0),
    };
  },
};

// Pricing API
export const pricingApi = {
  async getAll(): Promise<PricingConfig[]> {
    const now = new Date();

    if (isDemoMode) {
      return demoPricing.map((pricing) => {
        const activeVersion = demoPricingVersions
          .filter((version) => version.pricing_id === pricing.id && new Date(version.effective_from) <= now)
          .sort((a, b) => new Date(b.effective_from).getTime() - new Date(a.effective_from).getTime())[0];

        if (!activeVersion) {
          return pricing;
        }

        return {
          ...pricing,
          base_fee: activeVersion.base_fee,
          per_km_rate: activeVersion.per_km_rate,
          service_fee: activeVersion.service_fee,
          surge_multiplier: activeVersion.surge_multiplier,
          zone_multiplier: activeVersion.zone_multiplier,
          effective_from: activeVersion.effective_from,
        };
      });
    }
    
    const { data, error } = await supabase
      .from('pricing_config')
      .select('*')
      .order('vehicle_type');
    
    if (error) throw error;
    
    return data.map(p => ({
      id: p.id,
      vehicle_type: p.vehicle_type,
      base_fee: p.base_fee,
      per_km_rate: p.per_km_rate,
      service_fee: p.service_fee,
      surge_multiplier: p.surge_multiplier,
      zone_multiplier: p.zone_multiplier,
      effective_from: p.effective_from,
      is_active: p.is_active,
    }));
  },

  async getVersions(pricingId?: string): Promise<PricingVersion[]> {
    try {
      const response = await backendApi.getPricingVersions({ pricingId });
      if (response.success && response.data) {
        return response.data.map((version: any) => ({
          id: version.id,
          pricing_id: version.pricing_id,
          vehicle_type: version.vehicle_type,
          base_fee: version.base_fee,
          per_km_rate: version.per_km_rate,
          service_fee: version.service_fee,
          surge_multiplier: version.surge_multiplier,
          zone_multiplier: version.zone_multiplier,
          effective_from: version.effective_from,
          changed_at: version.changed_at || version.created_at,
          changed_by: version.changed_by,
        }));
      }
    } catch (error) {
      console.warn('Backend pricing versions failed, using fallback history.', error);
    }

    if (pricingId) {
      return demoPricingVersions
        .filter((version) => version.pricing_id === pricingId)
        .sort((a, b) => new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime());
    }

    return [...demoPricingVersions].sort((a, b) => new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime());
  },

  async update(id: string, data: Partial<PricingConfig>): Promise<void> {
    const effectiveFrom = data.effective_from || new Date().toISOString();

    try {
      const response = await backendApi.createPricingVersion(id, {
        base_fee: data.base_fee ?? 0,
        per_km_rate: data.per_km_rate ?? 0,
        service_fee: data.service_fee,
        surge_multiplier: data.surge_multiplier,
        zone_multiplier: data.zone_multiplier,
        effective_from: effectiveFrom,
        is_active: data.is_active,
      });
      if (response.success) {
        return;
      }
    } catch (error) {
      console.warn('Backend pricing update failed, falling back to Supabase.', error);
    }

    if (isDemoMode) {
      return;
    }
    
    const { error } = await supabase
      .from('pricing_config')
      .update(data)
      .eq('id', id);
    
    if (error) throw error;
  },
};

// Finance API
export const financeApi = {
  async getLedger(): Promise<FinanceLedgerEntry[]> {
    try {
      const response = await backendApi.getPaymentLedger();
      if (response.success && response.data) {
        return response.data.map((item: any) => ({
          id: item.id,
          type: item.type,
          amount: Number(item.amount || 0),
          status: item.status || PAYMENT_STATUSES[0],
          requestId: item.request_id || item.requestId || '-',
          userId: item.user_id || item.userId,
          operatorId: item.operator_id || item.operatorId,
          userName: item.user_name || item.userName || '-',
          operatorName: item.operator_name || item.operatorName || '-',
          method: item.method || item.payment_method || '-',
          date: item.date || item.created_at || new Date().toISOString(),
          relatedPaymentId: item.related_payment_id,
          reason: item.reason,
        }));
      }
    } catch (error) {
      throw backendFlowError('Backend request failed', error);
    }

    throw backendFlowError('Backend ledger response was empty');
  },

  async requestRefund(paymentId: string, amount: number, reason?: string): Promise<void> {
    try {
      const response = await backendApi.requestRefund(paymentId, { amount, reason });
      if (response.success) {
        return;
      }
    } catch (error) {
      throw backendFlowError('Backend request failed', error);
    }

    throw backendFlowError('Backend refund request response was empty');
  },

  async approveRefund(refundId: string, note?: string): Promise<void> {
    try {
      const response = await backendApi.approveRefund(refundId, { note });
      if (response.success) {
        return;
      }
    } catch (error) {
      throw backendFlowError('Backend request failed', error);
    }

    throw backendFlowError('Backend refund approval response was empty');
  },

  async rejectRefund(refundId: string, reason?: string): Promise<void> {
    try {
      const response = await backendApi.rejectRefund(refundId, { reason });
      if (response.success) {
        return;
      }
    } catch (error) {
      throw backendFlowError('Backend request failed', error);
    }

    throw backendFlowError('Backend refund rejection response was empty');
  },

  async processPayout(payoutId: string, note?: string): Promise<void> {
    try {
      const response = await backendApi.processPayout(payoutId, { note });
      if (response.success) {
        return;
      }
    } catch (error) {
      throw backendFlowError('Backend payout processing failed', error);
    }

    throw backendFlowError('Backend payout process response was empty');
  },

  async retryPayout(payoutId: string, note?: string): Promise<void> {
    try {
      const response = await backendApi.retryPayout(payoutId, { note });
      if (response.success) {
        return;
      }
    } catch (error) {
      throw backendFlowError('Backend payout retry failed', error);
    }

    throw backendFlowError('Backend payout retry response was empty');
  },

  async getPayoutQueue(): Promise<FinanceLedgerEntry[]> {
    const ledger = await this.getLedger();
    return ledger
      .filter((entry) => entry.type === 'payout' && (entry.status === 'pending' || entry.status === 'failed'))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  async getRefundQueue(): Promise<FinanceLedgerEntry[]> {
    const ledger = await this.getLedger();
    return ledger
      .filter((entry) => entry.type === 'refund' && entry.status === 'pending')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  async getWalletBalances(): Promise<WalletBalanceEntry[]> {
    const ledger = await this.getLedger();
    const byOperator = new Map<string, WalletBalanceEntry>();

    for (const entry of ledger) {
      const operatorKey = entry.operatorId || entry.operatorName || 'unknown-operator';
      const operatorName = entry.operatorName || 'Unknown Operator';

      if (!byOperator.has(operatorKey)) {
        byOperator.set(operatorKey, {
          operatorKey,
          operatorName,
          totalPayments: 0,
          totalPayouts: 0,
          totalRefundAdjustments: 0,
          balance: 0,
        });
      }

      const bucket = byOperator.get(operatorKey)!;

      if (entry.type === 'payment' && entry.status === 'completed') {
        bucket.totalPayments += entry.amount;
      }

      if (entry.type === 'payout' && entry.status === 'completed') {
        bucket.totalPayouts += entry.amount;
      }

      if (entry.type === 'refund' && entry.status === 'completed') {
        bucket.totalRefundAdjustments += entry.amount;
      }
    }

    return Array.from(byOperator.values())
      .map((entry) => ({
        ...entry,
        balance: Number((entry.totalPayments - entry.totalPayouts - entry.totalRefundAdjustments).toFixed(2)),
      }))
      .sort((a, b) => b.balance - a.balance);
  },
};

export type SupportDisputeDecision =
  | 'approve_refund'
  | 'reject_claim'
  | 'partial_refund'
  | 'operator_penalty'
  | 'no_action';

export const supportApi = {
  async getTickets(): Promise<SupportTicket[]> {
    try {
      const response = await backendApi.getSupportTickets();
      if (response.success && response.data) {
        return response.data.map((ticket: any) => ({
          id: ticket.id,
          user_id: ticket.user_id,
          user_name: ticket.user_name || 'Unknown User',
          user_email: ticket.user_email,
          subject: ticket.subject,
          message: ticket.message,
          category: ticket.category || (ticket.dispute_id ? 'dispute' : 'general'),
          status: ticket.status,
          priority: ticket.priority || 'medium',
          assigned_to: ticket.assigned_to,
          assigned_to_name: ticket.assigned_to_name,
          linked_request_id: ticket.linked_request_id,
          linked_payment_id: ticket.linked_payment_id,
          dispute_id: ticket.dispute_id,
          sla_due_at: ticket.sla_due_at,
          resolution_summary: ticket.resolution_summary,
          last_reply_at: ticket.last_reply_at,
          created_at: ticket.created_at,
          updated_at: ticket.updated_at,
        }));
      }
    } catch (error) {
      throw backendFlowError('Backend request failed', error);
    }

    throw backendFlowError('Backend support tickets response was empty');
  },

  async updateTicket(
    ticketId: string,
    payload: {
      status?: SupportTicket['status'];
      priority?: SupportTicket['priority'];
      assigned_to?: string;
      assigned_to_name?: string;
      sla_due_at?: string;
      resolution_summary?: string;
    }
  ): Promise<void> {
    try {
      const response = await backendApi.updateSupportTicket(ticketId, payload);
      if (response.success) {
        return;
      }
    } catch (error) {
      throw backendFlowError('Backend request failed', error);
    }

    throw backendFlowError('Backend support update response was empty');
  },

  async addReply(ticketId: string, message: string, actorId?: string): Promise<void> {
    try {
      const response = await backendApi.addSupportReply(ticketId, {
        message,
        is_internal: true,
        author_id: actorId,
      });
      if (response.success) {
        return;
      }
    } catch (error) {
      throw backendFlowError('Backend request failed', error);
    }

    throw backendFlowError('Backend support reply response was empty');
  },

  async resolveDispute(
    ticketId: string,
    decision: SupportDisputeDecision,
    note?: string,
    refundAmount?: number
  ): Promise<void> {
    const ticket = await this.getTickets().then((tickets) => tickets.find((item) => item.id === ticketId));
    if (!ticket || !ticket.dispute_id) {
      throw new Error('Support ticket or linked dispute not found.');
    }

    try {
      const response = await backendApi.resolveDispute(ticket.dispute_id, {
        decision,
        note,
        refund_amount: refundAmount,
      });
      if (response.success) {
        return;
      }
    } catch (error) {
      throw backendFlowError('Backend request failed', error);
    }

    throw backendFlowError('Backend dispute resolution response was empty');
  },

  async getStats(): Promise<{
    open: number;
    inProgress: number;
    resolved: number;
    closed: number;
    highPriorityOpen: number;
    disputeOpen: number;
    slaBreached: number;
  }> {
    const tickets = await this.getTickets();
    const now = Date.now();

    return {
      open: tickets.filter((ticket) => ticket.status === 'open').length,
      inProgress: tickets.filter((ticket) => ticket.status === SUPPORT_STATUS.inProgress).length,
      resolved: tickets.filter((ticket) => ticket.status === SUPPORT_STATUS.resolved).length,
      closed: tickets.filter((ticket) => ticket.status === SUPPORT_STATUS.closed).length,
      highPriorityOpen: tickets.filter(
        (ticket) =>
          ([SUPPORT_PRIORITY.high, SUPPORT_PRIORITY.urgent] as SupportPriority[]).includes(ticket.priority) &&
          ([SUPPORT_STATUS.open, SUPPORT_STATUS.inProgress] as SupportStatus[]).includes(ticket.status)
      ).length,
      disputeOpen: tickets.filter(
        (ticket) =>
          ticket.category === 'dispute' &&
          ([SUPPORT_STATUS.open, SUPPORT_STATUS.inProgress] as SupportStatus[]).includes(ticket.status)
      ).length,
      slaBreached: tickets.filter(
        (ticket) =>
          !!ticket.sla_due_at &&
          ([SUPPORT_STATUS.open, SUPPORT_STATUS.inProgress] as SupportStatus[]).includes(ticket.status) &&
          new Date(ticket.sla_due_at).getTime() < now
      ).length,
    };
  },
};

// Dashboard Stats API
export const dashboardApi = {
  async getStats() {
    const isToday = (isoDate?: string) => {
      if (!isoDate) return false;
      const date = new Date(isoDate);
      const now = new Date();
      return (
        date.getFullYear() === now.getFullYear() &&
        date.getMonth() === now.getMonth() &&
        date.getDate() === now.getDate()
      );
    };

    if (isDemoMode) {
      const completedRequests = demoRequests.filter((r) => r.status === REQUEST_STATUS.completed).length;
      const cancelledRequests = demoRequests.filter((r) => r.status === REQUEST_STATUS.cancelled).length;
      const totalRequests = demoRequests.length;

      return {
        totalUsers: demoUsers.length,
        totalOperators: demoOperators.filter(o => o.status === OPERATOR_STATUS.approved).length,
        pendingOperators: demoOperators.filter(o => o.status === OPERATOR_STATUS.pending).length,
        totalRequests,
        activeRequests: demoRequests.filter(r => r.status === REQUEST_STATUS.inProgress).length,
        completedRequests,
        cancelledRequests,
        pendingRequests: demoRequests.filter(r => r.status === REQUEST_STATUS.pending).length,
        completionRate: totalRequests > 0 ? Number(((completedRequests / totalRequests) * 100).toFixed(1)) : 0,
        cancellationRate: totalRequests > 0 ? Number(((cancelledRequests / totalRequests) * 100).toFixed(1)) : 0,
        totalRevenue: demoRequests
          .filter(r => r.final_price)
          .reduce((sum, r) => sum + (r.final_price || 0), 0),
        revenueToday: demoRequests
          .filter((r) => !!r.final_price && (isToday(r.completed_at) || isToday(r.created_at)))
          .reduce((sum, r) => sum + (r.final_price || 0), 0),
        onlineOperators: demoOperators.filter(o => o.is_online).length,
      };
    }
    
    // Get real stats from Supabase
    const [usersCount, operatorsResult, allRequests] = await Promise.all([
      usersApi.getCount(),
      operatorsApi.getAll(),
      requestsApi.getAll(),
    ]);

    const totalRequests = allRequests.length;
    const completedRequests = allRequests.filter((request) => request.status === REQUEST_STATUS.completed).length;
    const cancelledRequests = allRequests.filter((request) => request.status === REQUEST_STATUS.cancelled).length;
    const activeRequests = allRequests.filter((request) => request.status === REQUEST_STATUS.inProgress).length;
    const pendingRequests = allRequests.filter((request) => request.status === REQUEST_STATUS.pending).length;
    const totalRevenue = allRequests
      .filter((request) => !!request.final_price)
      .reduce((sum, request) => sum + (request.final_price || 0), 0);
    const revenueToday = allRequests
      .filter((request) => !!request.final_price && (isToday(request.completed_at) || isToday(request.created_at)))
      .reduce((sum, request) => sum + (request.final_price || 0), 0);
    
    return {
      totalUsers: usersCount,
      totalOperators: operatorsResult.filter(o => o.status === OPERATOR_STATUS.approved).length,
      pendingOperators: operatorsResult.filter(o => o.status === OPERATOR_STATUS.pending).length,
      totalRequests,
      activeRequests,
      completedRequests,
      cancelledRequests,
      pendingRequests,
      completionRate: totalRequests > 0 ? Number(((completedRequests / totalRequests) * 100).toFixed(1)) : 0,
      cancellationRate: totalRequests > 0 ? Number(((cancelledRequests / totalRequests) * 100).toFixed(1)) : 0,
      totalRevenue,
      revenueToday,
      onlineOperators: operatorsResult.filter(o => o.is_online).length,
    };
  },

  async getRevenueSeries(days = 7): Promise<RevenuePoint[]> {
    try {
      const response = await backendApi.getDashboardRevenueSeries({ days });
      if (response.success && response.data?.length) {
        return response.data.map((point: any) => ({
          date: point.date,
          revenue: Number(point.revenue || 0),
          trips: Number(point.trips || 0),
        }));
      }
    } catch (error) {
      console.warn('Backend revenue series failed, deriving from requests.', error);
    }

    const requests = await requestsApi.getAll();
    const completed = requests.filter((entry) => entry.status === REQUEST_STATUS.completed && !!entry.final_price);
    const now = new Date();
    const series: RevenuePoint[] = [];

    for (let i = days - 1; i >= 0; i -= 1) {
      const day = new Date(now);
      day.setHours(0, 0, 0, 0);
      day.setDate(day.getDate() - i);

      const nextDay = new Date(day);
      nextDay.setDate(nextDay.getDate() + 1);

      const dayPayments = completed.filter((entry) => {
        const date = new Date(entry.completed_at || entry.created_at);
        return date >= day && date < nextDay;
      });

      series.push({
        date: day.toISOString().slice(0, 10),
        revenue: Number(dayPayments.reduce((sum, entry) => sum + (entry.final_price || 0), 0).toFixed(2)),
        trips: dayPayments.length,
      });
    }

    return series;
  },

  async getAlerts(): Promise<
    Array<{
      id: string;
      category: 'failed_payments' | 'unresolved_disputes' | 'safety_incidents';
      severity: 'high' | 'medium';
      title: string;
      description: string;
      count: number;
      route: string;
    }>
  > {
    const [ledgerResult, requestsResult, supportStatsResult] = await Promise.allSettled([
      financeApi.getLedger(),
      requestsApi.getAll(),
      supportApi.getStats(),
    ]);

    const ledger = ledgerResult.status === 'fulfilled' ? ledgerResult.value : [];
    const requests = requestsResult.status === 'fulfilled' ? requestsResult.value : [];
    const supportStats =
      supportStatsResult.status === 'fulfilled'
        ? supportStatsResult.value
        : { open: 0, inProgress: 0, resolved: 0, closed: 0, highPriorityOpen: 0, disputeOpen: 0, slaBreached: 0 };

    const failedPayments = ledger.filter((entry) => entry.type === 'payment' && entry.status === 'failed').length;
    const unresolvedDisputes = supportStats.disputeOpen;
    const safetyIncidents = requests.filter(
      (request) => request.is_fraud_suspected || request.emergency_override || request.is_escalated
    ).length;

    const alerts: Array<{
      id: string;
      category: 'failed_payments' | 'unresolved_disputes' | 'safety_incidents';
      severity: 'high' | 'medium';
      title: string;
      description: string;
      count: number;
      route: string;
    }> = [];

    if (failedPayments > 0) {
      alerts.push({
        id: 'failed-payments',
        category: 'failed_payments',
        severity: 'high',
        title: 'Failed Payments',
        description: `${failedPayments} payment${failedPayments > 1 ? 's are' : ' is'} failing and needs follow-up.`,
        count: failedPayments,
        route: '/payments',
      });
    }

    if (unresolvedDisputes > 0) {
      alerts.push({
        id: 'unresolved-disputes',
        category: 'unresolved_disputes',
        severity: 'medium',
        title: 'Unresolved Disputes',
        description: `${unresolvedDisputes} open dispute case${unresolvedDisputes > 1 ? 's are' : ' is'} awaiting review.`,
        count: unresolvedDisputes,
        route: '/support',
      });
    }

    if (safetyIncidents > 0) {
      alerts.push({
        id: 'safety-incidents',
        category: 'safety_incidents',
        severity: 'high',
        title: 'Safety Incidents',
        description: `${safetyIncidents} request${safetyIncidents > 1 ? 's are' : ' is'} flagged for fraud/escalation/emergency review.`,
        count: safetyIncidents,
        route: '/requests',
      });
    }

    return alerts;
  },

  async getRecentRequests(): Promise<TowRequest[]> {
    if (isDemoMode) {
      return demoRequests.slice(0, 5);
    }
    
    const allRequests = await requestsApi.getAll();
    return allRequests.slice(0, 5);
  },

  async getPendingOperators(): Promise<Operator[]> {
    if (isDemoMode) {
      return demoOperators.filter(o => o.status === OPERATOR_STATUS.pending).slice(0, 5);
    }
    
    const allOperators = await operatorsApi.getAll();
    return allOperators.filter(o => o.status === OPERATOR_STATUS.pending).slice(0, 5);
  },
};

export const notificationsApi = {
  async getAll(unreadOnly = false): Promise<Notification[]> {
    try {
      const response = await backendApi.getNotifications({ unreadOnly, limit: 100 });
      if (response.success && response.data) {
        return response.data.map((notification: any) => ({
          id: notification.id,
          type: notification.type || 'system',
          title: notification.title,
          message: notification.message,
          target: notification.target || 'all',
          is_read: Boolean(notification.is_read ?? notification.read),
          read_at: notification.read_at,
          severity: notification.severity || 'low',
          action_url: notification.action_url,
          created_at: notification.created_at,
        }));
      }
    } catch (error) {
      console.warn('Backend notifications fetch failed, falling back to Supabase.', error);
    }

    if (isDemoMode) {
      return [];
    }

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    const records = (data || []).map((notification: any) => ({
      id: notification.id,
      type: notification.type || 'system',
      title: notification.title,
      message: notification.message,
      target: notification.target || 'all',
      is_read: Boolean(notification.is_read),
      read_at: notification.read_at,
      severity: notification.severity || 'low',
      action_url: notification.action_url,
      created_at: notification.created_at,
    }));

    return unreadOnly ? records.filter((item) => !item.is_read) : records;
  },

  async markRead(id: string): Promise<void> {
    try {
      const response = await backendApi.markNotificationRead(id);
      if (response.success) {
        return;
      }
    } catch (error) {
      console.warn('Backend notification mark-read failed, falling back to Supabase.', error);
    }

    if (isDemoMode) {
      return;
    }

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
  },

  async markAllRead(): Promise<void> {
    try {
      const response = await backendApi.markAllNotificationsRead();
      if (response.success) {
        return;
      }
    } catch (error) {
      console.warn('Backend mark-all-read failed, falling back to Supabase.', error);
    }

    if (isDemoMode) {
      return;
    }

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('target', 'admin');

    if (error) throw error;
  },

  async delete(id: string): Promise<void> {
    try {
      const response = await backendApi.deleteNotification(id);
      if (response.success) {
        return;
      }
    } catch (error) {
      console.warn('Backend notification delete failed, falling back to Supabase.', error);
    }

    if (isDemoMode) {
      return;
    }

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async clearAll(): Promise<void> {
    try {
      const response = await backendApi.clearNotifications();
      if (response.success) {
        return;
      }
    } catch (error) {
      console.warn('Backend clear notifications failed, falling back to Supabase.', error);
    }

    if (isDemoMode) {
      return;
    }

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('target', 'admin');

    if (error) throw error;
  },
};

export const settingsApi = {
  async get(): Promise<AdminSettings> {
    const storageKey = 'towme_admin_settings';

    try {
      const response = await backendApi.getAdminSettings();
      if (response.success && response.data) {
        const settings: AdminSettings = {
          profile: {
            name: response.data.profile?.name || 'Admin User',
            email: response.data.profile?.email || 'admin@towme.com',
            phone: response.data.profile?.phone,
            avatar_url: resolveBackendAssetUrl(response.data.profile?.avatar_url) || null,
          },
          notifications: {
            emailNotifications: Boolean(response.data.notifications?.emailNotifications ?? true),
            pushNotifications: Boolean(response.data.notifications?.pushNotifications ?? true),
            newOperators: Boolean(response.data.notifications?.newOperators ?? true),
            newRequests: Boolean(response.data.notifications?.newRequests ?? true),
            payments: Boolean(response.data.notifications?.payments ?? true),
            systemAlerts: Boolean(response.data.notifications?.systemAlerts ?? true),
          },
          system: {
            language: response.data.system?.language || 'English',
            timezone: response.data.system?.timezone || 'Africa/Accra',
            currency: response.data.system?.currency || 'GHS',
          },
        };

        writeToStorage(storageKey, JSON.stringify(settings));
        return settings;
      }
    } catch (error) {
      console.warn('Backend settings fetch failed, falling back to local cache.', error);
    }

    const local = readFromStorage(storageKey);
    if (local) {
      try {
        return JSON.parse(local) as AdminSettings;
      } catch {
        // Ignore malformed local cache and return defaults below.
      }
    }

    const defaults = getDefaultAdminSettings();
    writeToStorage(storageKey, JSON.stringify(defaults));
    return defaults;
  },

  async update(payload: {
    profile?: Partial<AdminSettings['profile']>;
    notifications?: Partial<AdminSettings['notifications']>;
    system?: Partial<AdminSettings['system']>;
  }): Promise<void> {
    const storageKey = 'towme_admin_settings';

    try {
      const response = await backendApi.updateAdminSettings(payload);
      if (response.success) {
        const current = await this.get();
        const nextState: AdminSettings = {
          profile: { ...current.profile, ...(payload.profile || {}) },
          notifications: { ...current.notifications, ...(payload.notifications || {}) },
          system: { ...current.system, ...(payload.system || {}) },
        };
        writeToStorage(storageKey, JSON.stringify(nextState));
        return;
      }
    } catch (error) {
      console.warn('Backend settings update failed, writing to local cache.', error);
    }

    const current = await this.get();
    const nextState: AdminSettings = {
      profile: { ...current.profile, ...(payload.profile || {}) },
      notifications: { ...current.notifications, ...(payload.notifications || {}) },
      system: { ...current.system, ...(payload.system || {}) },
    };
    writeToStorage(storageKey, JSON.stringify(nextState));
  },
};

export const securityApi = {
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      const response = await backendApi.changePassword({ currentPassword, newPassword });
      if (response.success) {
        return;
      }
    } catch (error) {
      throw backendFlowError('Backend request failed', error);
    }

    throw backendFlowError('Password change requires backend response validation');
  },

  async setTwoFactorEnabled(enabled: boolean): Promise<void> {
    try {
      const response = await backendApi.updateTwoFactor({ enabled });
      if (response.success) {
        return;
      }
    } catch (error) {
      throw backendFlowError('Backend request failed', error);
    }
  },
};

export const auditApi = {
  async getAll(params?: {
    page?: number;
    limit?: number;
    action?: string;
    search?: string;
    from?: string;
    to?: string;
  }): Promise<AuditLogRecord[]> {
    try {
      const response = await backendApi.getAuditLogs(params);
      if (response.success && response.data) {
        return response.data.map((item: any) => ({
          id: item.id,
          action: item.action,
          resource_type: item.resource_type || item.resourceType,
          resource_id: item.resource_id || item.resourceId,
          actor_id: item.actor_id || item.actorId,
          before: item.before,
          after: item.after,
          metadata: item.metadata,
          timestamp: item.timestamp || item.created_at,
        }));
      }
    } catch (error) {
      console.warn('Backend audit logs fetch failed, falling back to Supabase.', error);
    }

    if (isDemoMode) {
      return [];
    }

    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('timestamp', { ascending: false });

    if (error) throw error;

    return (data || []).map((item: any) => ({
      id: item.id,
      action: item.action,
      resource_type: item.resource_type,
      resource_id: item.resource_id,
      actor_id: item.actor_id,
      before: item.before,
      after: item.after,
      metadata: item.metadata,
      timestamp: item.timestamp || item.created_at,
    }));
  },

  async getPaginated(params?: {
    page?: number;
    limit?: number;
    action?: string;
    search?: string;
    from?: string;
    to?: string;
  }): Promise<{ items: AuditLogRecord[]; total: number; page: number; limit: number }> {
    const page = params?.page || 1;
    const limit = params?.limit || 20;

    try {
      const response = await backendApi.getAuditLogs(params);
      if (response.success && response.data) {
        const items = response.data.map((item: any) => ({
          id: item.id,
          action: item.action,
          resource_type: item.resource_type || item.resourceType,
          resource_id: item.resource_id || item.resourceId,
          actor_id: item.actor_id || item.actorId,
          before: item.before,
          after: item.after,
          metadata: item.metadata,
          timestamp: item.timestamp || item.created_at,
        }));

        return {
          items,
          total: response.pagination?.total || items.length,
          page: response.pagination?.page || page,
          limit: response.pagination?.limit || limit,
        };
      }
    } catch (error) {
      console.warn('Backend paginated audit logs failed, falling back to Supabase.', error);
    }

    if (isDemoMode) {
      return { items: [], total: 0, page, limit };
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const query = supabase
      .from('audit_logs')
      .select('*', { count: 'exact' })
      .order('timestamp', { ascending: false })
      .range(from, to);

    const { data, error, count } = await query;
    if (error) throw error;

    const items = (data || []).map((item: any) => ({
      id: item.id,
      action: item.action,
      resource_type: item.resource_type,
      resource_id: item.resource_id,
      actor_id: item.actor_id,
      before: item.before,
      after: item.after,
      metadata: item.metadata,
      timestamp: item.timestamp || item.created_at,
    }));

    return {
      items,
      total: count || items.length,
      page,
      limit,
    };
  },
};

export type BackendReadinessStatus = 'healthy' | 'warning' | 'down';

export interface BackendReadinessCheck {
  id: string;
  label: string;
  status: BackendReadinessStatus;
  message: string;
  checkedAt: string;
}

export const readinessApi = {
  async checkModules(): Promise<BackendReadinessCheck[]> {
    const checkedAt = new Date().toISOString();

    const checks: Array<{
      id: string;
      label: string;
      probe: () => Promise<unknown>;
    }> = [
      {
        id: 'dashboard',
        label: 'Dashboard Stats',
        probe: async () => {
          await backendApi.getDashboardStats();
        },
      },
      {
        id: 'operators',
        label: 'Operator Verification',
        probe: async () => {
          await backendApi.getOperators({ page: 1, limit: 1 });
        },
      },
      {
        id: 'requests',
        label: 'Live Requests',
        probe: async () => {
          await backendApi.getRequests({ page: 1, limit: 1 });
        },
      },
      {
        id: 'pricing',
        label: 'Pricing Management',
        probe: async () => {
          await backendApi.getPricing();
        },
      },
      {
        id: 'payments',
        label: 'Payments Ledger',
        probe: async () => {
          await backendApi.getPaymentLedger({ page: 1, limit: 1 });
        },
      },
      {
        id: 'support',
        label: 'Support Tickets',
        probe: async () => {
          await backendApi.getSupportTickets({ page: 1, limit: 1 });
        },
      },
      {
        id: 'notifications',
        label: 'Notifications',
        probe: async () => {
          await backendApi.getNotifications({ page: 1, limit: 1 });
        },
      },
      {
        id: 'audit',
        label: 'Audit Logs',
        probe: async () => {
          await backendApi.getAuditLogs({ page: 1, limit: 1 });
        },
      },
    ];

    const results = await Promise.all(
      checks.map(async (check) => {
        try {
          await check.probe();
          return {
            id: check.id,
            label: check.label,
            status: 'healthy' as const,
            message: 'Operational',
            checkedAt,
          };
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error || 'Unknown error');

          const lowered = message.toLowerCase();
          const isAuthIssue = lowered.includes('401') || lowered.includes('403') || lowered.includes('unauthorized') || lowered.includes('forbidden');

          return {
            id: check.id,
            label: check.label,
            status: (isAuthIssue ? 'warning' : 'down') as BackendReadinessStatus,
            message: isAuthIssue ? 'Endpoint reachable but auth/session is limited' : message,
            checkedAt,
          };
        }
      })
    );

    if (isDemoMode) {
      return results.map((entry) => ({
        ...entry,
        status: entry.status === 'down' ? 'warning' : entry.status,
        message:
          entry.status === 'healthy'
            ? 'Demo mode active; backend verification may be partial'
            : entry.message,
      }));
    }

    return results;
  },
};

