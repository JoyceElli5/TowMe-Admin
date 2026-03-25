import { supabase, isDemoMode } from './supabase';
import { backendApi } from './backend-api';
import type {
  Operator,
  AppUser,
  SupportTicket,
  TowRequest,
  PricingConfig,
  PricingVersion,
  RequestInterventionAction,
  UserModerationAction,
} from '../types';

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

const demoSupportTickets: SupportTicket[] = [
  {
    id: 'TKT-001',
    user_id: '1',
    user_name: 'Ama Serwaa',
    user_email: 'ama.serwaa@email.com',
    subject: 'Payment charged twice',
    message: 'I was charged twice for one completed request and need a review.',
    category: 'dispute',
    status: 'open',
    priority: 'urgent',
    assigned_to: 'support-1',
    assigned_to_name: 'Support Lead',
    linked_request_id: '1',
    linked_payment_id: 'PAY-001',
    dispute_id: 'DSP-001',
    sla_due_at: '2026-03-26T09:00:00Z',
    created_at: '2026-03-25T09:30:00Z',
    updated_at: '2026-03-25T09:30:00Z',
  },
  {
    id: 'TKT-002',
    user_id: '2',
    user_name: 'Kofi Boateng',
    user_email: 'kofi.boateng@email.com',
    subject: 'Operator arrived late',
    message: 'My tow request was delayed by over one hour with no notification.',
    category: 'complaint',
    status: 'in_progress',
    priority: 'high',
    assigned_to: 'support-2',
    assigned_to_name: 'Ops Support',
    linked_request_id: '2',
    sla_due_at: '2026-03-25T18:00:00Z',
    created_at: '2026-03-24T12:00:00Z',
    updated_at: '2026-03-25T08:10:00Z',
  },
  {
    id: 'TKT-003',
    user_id: '3',
    user_name: 'Akua Mensah',
    user_email: 'akua.mensah@email.com',
    subject: 'App crash at checkout',
    message: 'The app closes every time I confirm payment on Android.',
    category: 'technical',
    status: 'resolved',
    priority: 'medium',
    assigned_to: 'support-3',
    assigned_to_name: 'Technical Support',
    resolution_summary: 'Escalated to mobile team; patch deployed and user confirmed fix.',
    created_at: '2026-03-22T10:20:00Z',
    updated_at: '2026-03-23T15:00:00Z',
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
  status: 'completed' | 'pending' | 'failed';
  requestId: string;
  userName: string;
  operatorName: string;
  method: string;
  date: string;
  relatedPaymentId?: string;
  reason?: string;
}

const demoFinanceLedger: FinanceLedgerEntry[] = [
  {
    id: 'PAY-001',
    type: 'payment',
    amount: 150.0,
    status: 'completed',
    requestId: 'REQ-1234',
    userName: 'Ama Serwaa',
    operatorName: 'John Mensah',
    method: 'Mobile Money',
    date: '2026-02-05 14:30',
  },
  {
    id: 'PAY-002',
    type: 'payment',
    amount: 200.0,
    status: 'completed',
    requestId: 'REQ-1233',
    userName: 'Kofi Boateng',
    operatorName: 'Kwame Asante',
    method: 'Card',
    date: '2026-02-05 12:15',
  },
  {
    id: 'REF-003',
    type: 'refund',
    amount: 50.0,
    status: 'completed',
    requestId: 'REQ-1225',
    userName: 'Akua Mensah',
    operatorName: 'Yaw Frimpong',
    method: 'Mobile Money',
    date: '2026-02-04 16:45',
    relatedPaymentId: 'PAY-001',
  },
  {
    id: 'PAY-004',
    type: 'payout',
    amount: 850.0,
    status: 'completed',
    requestId: '-',
    userName: '-',
    operatorName: 'John Mensah',
    method: 'Bank Transfer',
    date: '2026-02-04 10:00',
  },
  {
    id: 'PAY-005',
    type: 'payment',
    amount: 175.0,
    status: 'pending',
    requestId: 'REQ-1235',
    userName: 'Kwesi Appiah',
    operatorName: 'Samuel Osei',
    method: 'Mobile Money',
    date: '2026-02-05 15:00',
  },
  {
    id: 'PAY-006',
    type: 'payment',
    amount: 125.0,
    status: 'failed',
    requestId: 'REQ-1236',
    userName: 'Efua Owusu',
    operatorName: 'John Mensah',
    method: 'Card',
    date: '2026-02-05 15:30',
  },
];

// ============================================================================
// API FUNCTIONS - Returns demo data or real Supabase data
// ============================================================================

// Operators API
export const operatorsApi = {
  canTransitionStatus(
    currentStatus: Operator['status'],
    nextStatus: 'approved' | 'rejected' | 'suspended'
  ): boolean {
    const allowedTransitions: Record<Operator['status'], Array<'approved' | 'rejected' | 'suspended'>> = {
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
          status: op.status || 'pending',
          profile_photo_url: op.profile_photo_url,
          ghana_card_url: op.documents?.find((d: any) => d.document_type === 'ghana_card')?.document_url,
          drivers_license_url: op.documents?.find((d: any) => d.document_type === 'drivers_license')?.document_url,
          vehicle_registration_url: op.documents?.find((d: any) => d.document_type === 'vehicle_registration')?.document_url,
          insurance_url: op.documents?.find((d: any) => d.document_type === 'insurance')?.document_url,
          rating: op.rating || 0,
          total_trips: op.total_trips || 0,
          earnings: op.earnings || 0,
          is_online: op.is_online || false,
          created_at: op.created_at,
          updated_at: op.updated_at,
        }));
      }
    } catch (error) {
      console.log('Backend API failed, falling back to demo data:', error);
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
      status: user.verification_status || 'pending',
      profile_photo_url: user.operator_photo_url || user.avatar_url,
      ghana_card_url: user.ghana_card_photo_url,
      drivers_license_url: user.drivers_license_photo_url,
      vehicle_registration_url: user.vehicle_registration_photo_url,
      insurance_url: user.insurance_photo_url,
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
      status: data.verification_status || 'pending',
      profile_photo_url: data.operator_photo_url || data.avatar_url,
      ghana_card_url: data.ghana_card_photo_url,
      drivers_license_url: data.drivers_license_photo_url,
      vehicle_registration_url: data.vehicle_registration_photo_url,
      insurance_url: data.insurance_photo_url,
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
    status: 'approved' | 'rejected' | 'suspended',
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
      console.log('Backend API failed, falling back to demo/supabase:', error);
    }

    if (isDemoMode) {
      const operator = demoOperators.find(op => op.id === id);
      if (operator) {
        operator.status = status;
        operator.updated_at = new Date().toISOString();
      }
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
      return demoOperators.filter(op => op.status === 'pending').length;
    }
    
    const { count, error } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'tow_operator')
      .eq('verification_status', 'pending');
    
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
          avatar_url: user.avatar_url,
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
      console.log('Backend API failed, falling back to demo data:', error);
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
      avatar_url: user.avatar_url,
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
      console.log('Backend user moderation failed, falling back to demo/supabase:', error);
    }

    if (isDemoMode) {
      const user = demoUsers.find((item) => item.id === userId);
      if (!user) {
        throw new Error('User not found');
      }

      if (action === 'soft_ban') {
        user.is_active = false;
        user.moderation_status = 'soft_banned';
        user.ban_reason = payload?.reason;
        user.banned_at = new Date().toISOString();
      }

      if (action === 'permanent_ban') {
        user.is_active = false;
        user.moderation_status = 'permanently_banned';
        user.ban_reason = payload?.reason;
        user.banned_at = new Date().toISOString();
      }

      if (action === 'unblock') {
        user.is_active = true;
        user.moderation_status = 'active';
        user.ban_reason = undefined;
        user.banned_at = undefined;
      }
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
      console.log('Backend user auth reset failed, falling back to no-op demo flow:', error);
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
        return ['pending', 'accepted', 'en_route', 'arrived', 'in_progress'].includes(request.status);
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
            address: req.pickup_address,
            latitude: 0,
            longitude: 0,
          },
          destination: {
            address: req.dropoff_address,
            latitude: 0,
            longitude: 0,
          },
          vehicle_type: req.vehicle_type,
          status: req.status,
          estimated_price: req.estimated_price,
          final_price: req.final_price,
          distance_km: 0,
          created_at: req.created_at,
          completed_at: req.completed_at,
          is_escalated: req.is_escalated,
          escalated_at: req.escalated_at,
          is_fraud_suspected: req.is_fraud_suspected,
          emergency_override: req.emergency_override,
          intervention_notes: req.intervention_notes,
        }));
      }
    } catch (error) {
      console.log('Backend API failed, falling back to demo data:', error);
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
      console.log('Backend API intervention failed, falling back to demo/supabase:', error);
    }

    if (isDemoMode) {
      const request = demoRequests.find((item) => item.id === requestId);
      if (!request) {
        throw new Error('Request not found');
      }

      if (!this.canIntervene(request, action)) {
        throw new Error(`Intervention not allowed for request status: ${request.status}`);
      }

      const now = new Date().toISOString();
      switch (action) {
        case 'cancel':
          request.status = 'cancelled';
          request.cancelled_at = now;
          request.cancellation_reason = payload?.reason || 'Cancelled by admin';
          break;
        case 'reassign':
          request.operator_id = payload?.operator_id || undefined;
          request.operator_name = payload?.operator_name || 'Reassigned by admin';
          break;
        case 'escalate':
          request.is_escalated = true;
          request.escalated_at = now;
          request.intervention_notes = payload?.note;
          break;
        case 'mark_fraud':
          request.is_fraud_suspected = true;
          request.intervention_notes = payload?.note;
          break;
        case 'emergency_override':
          request.emergency_override = true;
          request.intervention_notes = payload?.note;
          break;
      }
      return;
    }

    if (action === 'cancel') {
      const { error } = await supabase
        .from('towing_requests')
        .update({
          status: 'cancelled',
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
        pending: demoRequests.filter(r => r.status === 'pending').length,
        inProgress: demoRequests.filter(r => r.status === 'in_progress').length,
        completed: demoRequests.filter(r => r.status === 'completed').length,
        cancelled: demoRequests.filter(r => r.status === 'cancelled').length,
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
      pending: data.filter(r => r.status === 'pending').length,
      inProgress: data.filter(r => r.status === 'in_progress').length,
      completed: data.filter(r => r.status === 'completed').length,
      cancelled: data.filter(r => r.status === 'cancelled').length,
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
      console.log('Backend pricing versions failed, falling back to demo data:', error);
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
      console.log('Backend pricing version creation failed, falling back to demo/supabase:', error);
    }

    if (isDemoMode) {
      const pricing = demoPricing.find(p => p.id === id);
      if (pricing) {
        Object.assign(pricing, data);

        demoPricingVersions.unshift({
          id: `pv-${id}-${Date.now()}`,
          pricing_id: id,
          vehicle_type: pricing.vehicle_type,
          base_fee: data.base_fee ?? pricing.base_fee,
          per_km_rate: data.per_km_rate ?? pricing.per_km_rate,
          service_fee: data.service_fee ?? pricing.service_fee,
          surge_multiplier: data.surge_multiplier ?? pricing.surge_multiplier,
          zone_multiplier: data.zone_multiplier ?? pricing.zone_multiplier,
          effective_from: effectiveFrom,
          changed_at: new Date().toISOString(),
          changed_by: 'admin',
        });
      }
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
          status: item.status || 'pending',
          requestId: item.request_id || item.requestId || '-',
          userName: item.user_name || item.userName || '-',
          operatorName: item.operator_name || item.operatorName || '-',
          method: item.method || item.payment_method || '-',
          date: item.date || item.created_at || new Date().toISOString(),
          relatedPaymentId: item.related_payment_id,
          reason: item.reason,
        }));
      }
    } catch (error) {
      console.log('Backend finance ledger failed, falling back to demo data:', error);
    }

    if (isDemoMode) {
      return demoFinanceLedger;
    }

    return demoFinanceLedger;
  },

  async requestRefund(paymentId: string, amount: number, reason?: string): Promise<void> {
    try {
      const response = await backendApi.requestRefund(paymentId, { amount, reason });
      if (response.success) {
        return;
      }
    } catch (error) {
      console.log('Backend refund request failed, falling back to demo behavior:', error);
    }

    const payment = demoFinanceLedger.find((entry) => entry.id === paymentId && entry.type === 'payment');
    if (!payment) {
      throw new Error('Payment record not found for refund request.');
    }

    demoFinanceLedger.unshift({
      id: `REF-${Date.now()}`,
      type: 'refund',
      amount,
      status: 'pending',
      requestId: payment.requestId,
      userName: payment.userName,
      operatorName: payment.operatorName,
      method: payment.method,
      date: new Date().toISOString(),
      relatedPaymentId: paymentId,
      reason,
    });
  },

  async approveRefund(refundId: string, note?: string): Promise<void> {
    try {
      const response = await backendApi.approveRefund(refundId, { note });
      if (response.success) {
        return;
      }
    } catch (error) {
      console.log('Backend refund approval failed, falling back to demo behavior:', error);
    }

    const refund = demoFinanceLedger.find((entry) => entry.id === refundId && entry.type === 'refund');
    if (!refund) {
      throw new Error('Refund record not found.');
    }

    refund.status = 'completed';
    refund.reason = note || refund.reason;
  },

  async rejectRefund(refundId: string, reason?: string): Promise<void> {
    try {
      const response = await backendApi.rejectRefund(refundId, { reason });
      if (response.success) {
        return;
      }
    } catch (error) {
      console.log('Backend refund rejection failed, falling back to demo behavior:', error);
    }

    const refund = demoFinanceLedger.find((entry) => entry.id === refundId && entry.type === 'refund');
    if (!refund) {
      throw new Error('Refund record not found.');
    }

    refund.status = 'failed';
    refund.reason = reason || refund.reason;
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
      console.log('Backend support tickets failed, falling back to demo data:', error);
    }

    return demoSupportTickets;
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
      console.log('Backend support update failed, falling back to demo behavior:', error);
    }

    const ticket = demoSupportTickets.find((item) => item.id === ticketId);
    if (!ticket) {
      throw new Error('Support ticket not found.');
    }

    Object.assign(ticket, payload, { updated_at: new Date().toISOString() });
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
      console.log('Backend support reply failed, falling back to demo behavior:', error);
    }

    const ticket = demoSupportTickets.find((item) => item.id === ticketId);
    if (!ticket) {
      throw new Error('Support ticket not found.');
    }

    ticket.last_reply_at = new Date().toISOString();
    ticket.updated_at = ticket.last_reply_at;
  },

  async resolveDispute(
    ticketId: string,
    decision: SupportDisputeDecision,
    note?: string,
    refundAmount?: number
  ): Promise<void> {
    const ticket = demoSupportTickets.find((item) => item.id === ticketId);

    if (!ticket) {
      throw new Error('Support ticket not found.');
    }

    if (!ticket.dispute_id) {
      throw new Error('This ticket has no dispute attached.');
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
      console.log('Backend dispute resolution failed, falling back to demo behavior:', error);
    }

    ticket.status = 'resolved';
    ticket.resolution_summary = [
      `Decision: ${decision.replace('_', ' ')}`,
      refundAmount ? `Refund: GHS ${refundAmount.toFixed(2)}` : undefined,
      note,
    ]
      .filter(Boolean)
      .join(' | ');
    ticket.updated_at = new Date().toISOString();
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
      inProgress: tickets.filter((ticket) => ticket.status === 'in_progress').length,
      resolved: tickets.filter((ticket) => ticket.status === 'resolved').length,
      closed: tickets.filter((ticket) => ticket.status === 'closed').length,
      highPriorityOpen: tickets.filter(
        (ticket) => ['high', 'urgent'].includes(ticket.priority) && ['open', 'in_progress'].includes(ticket.status)
      ).length,
      disputeOpen: tickets.filter(
        (ticket) => ticket.category === 'dispute' && ['open', 'in_progress'].includes(ticket.status)
      ).length,
      slaBreached: tickets.filter(
        (ticket) =>
          !!ticket.sla_due_at &&
          ['open', 'in_progress'].includes(ticket.status) &&
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
      const completedRequests = demoRequests.filter((r) => r.status === 'completed').length;
      const cancelledRequests = demoRequests.filter((r) => r.status === 'cancelled').length;
      const totalRequests = demoRequests.length;

      return {
        totalUsers: demoUsers.length,
        totalOperators: demoOperators.filter(o => o.status === 'approved').length,
        pendingOperators: demoOperators.filter(o => o.status === 'pending').length,
        totalRequests,
        activeRequests: demoRequests.filter(r => r.status === 'in_progress').length,
        completedRequests,
        cancelledRequests,
        pendingRequests: demoRequests.filter(r => r.status === 'pending').length,
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
    const completedRequests = allRequests.filter((request) => request.status === 'completed').length;
    const cancelledRequests = allRequests.filter((request) => request.status === 'cancelled').length;
    const activeRequests = allRequests.filter((request) => request.status === 'in_progress').length;
    const pendingRequests = allRequests.filter((request) => request.status === 'pending').length;
    const totalRevenue = allRequests
      .filter((request) => !!request.final_price)
      .reduce((sum, request) => sum + (request.final_price || 0), 0);
    const revenueToday = allRequests
      .filter((request) => !!request.final_price && (isToday(request.completed_at) || isToday(request.created_at)))
      .reduce((sum, request) => sum + (request.final_price || 0), 0);
    
    return {
      totalUsers: usersCount,
      totalOperators: operatorsResult.filter(o => o.status === 'approved').length,
      pendingOperators: operatorsResult.filter(o => o.status === 'pending').length,
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
    const [ledger, requests, supportStats] = await Promise.all([
      financeApi.getLedger(),
      requestsApi.getAll(),
      supportApi.getStats(),
    ]);

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
      return demoOperators.filter(o => o.status === 'pending').slice(0, 5);
    }
    
    const allOperators = await operatorsApi.getAll();
    return allOperators.filter(o => o.status === 'pending').slice(0, 5);
  },
};
