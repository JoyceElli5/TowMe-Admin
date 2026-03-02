import { supabase, isDemoMode } from './supabase';
import { backendApi } from './backend-api';
import type { Operator, AppUser, TowRequest, PricingConfig } from '../types';

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
  { id: '1', vehicle_type: 'Motorcycle', base_fee: 20, per_km_rate: 3, is_active: true },
  { id: '2', vehicle_type: 'Saloon', base_fee: 50, per_km_rate: 5, is_active: true },
  { id: '3', vehicle_type: 'SUV', base_fee: 60, per_km_rate: 6, is_active: true },
  { id: '4', vehicle_type: 'Van', base_fee: 70, per_km_rate: 7, is_active: true },
  { id: '5', vehicle_type: 'Truck', base_fee: 100, per_km_rate: 10, is_active: true },
];

// ============================================================================
// API FUNCTIONS - Returns demo data or real Supabase data
// ============================================================================

// Operators API
export const operatorsApi = {
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

  async updateStatus(id: string, status: 'approved' | 'rejected'): Promise<void> {
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
      total_trips: user.total_trips || 0,
      created_at: user.created_at,
      last_login: user.updated_at,
    }));
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
    }));
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
    if (isDemoMode) {
      return demoPricing;
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
      is_active: p.is_active,
    }));
  },

  async update(id: string, data: Partial<PricingConfig>): Promise<void> {
    if (isDemoMode) {
      const pricing = demoPricing.find(p => p.id === id);
      if (pricing) {
        Object.assign(pricing, data);
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

// Dashboard Stats API
export const dashboardApi = {
  async getStats() {
    if (isDemoMode) {
      return {
        totalUsers: demoUsers.length,
        totalOperators: demoOperators.filter(o => o.status === 'approved').length,
        pendingOperators: demoOperators.filter(o => o.status === 'pending').length,
        totalRequests: demoRequests.length,
        activeRequests: demoRequests.filter(r => r.status === 'in_progress').length,
        completedRequests: demoRequests.filter(r => r.status === 'completed').length,
        totalRevenue: demoRequests
          .filter(r => r.final_price)
          .reduce((sum, r) => sum + (r.final_price || 0), 0),
        onlineOperators: demoOperators.filter(o => o.is_online).length,
      };
    }
    
    // Get real stats from Supabase
    const [usersCount, operatorsResult, requestsResult] = await Promise.all([
      usersApi.getCount(),
      operatorsApi.getAll(),
      requestsApi.getStats(),
    ]);
    
    return {
      totalUsers: usersCount,
      totalOperators: operatorsResult.filter(o => o.status === 'approved').length,
      pendingOperators: operatorsResult.filter(o => o.status === 'pending').length,
      totalRequests: requestsResult.pending + requestsResult.inProgress + requestsResult.completed + requestsResult.cancelled,
      activeRequests: requestsResult.inProgress,
      completedRequests: requestsResult.completed,
      totalRevenue: requestsResult.totalRevenue,
      onlineOperators: operatorsResult.filter(o => o.is_online).length,
    };
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
