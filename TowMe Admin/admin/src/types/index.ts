// Admin user roles
export type AdminRole = 'super_admin' | 'operator_manager' | 'support_staff';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  avatar_url?: string | null;
  created_at: string;
  last_login?: string;
}

// Operator types
export interface Operator {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  profile_photo_url?: string;
  ghana_card_url?: string;
  drivers_license_url?: string;
  vehicle_registration_url?: string;
  insurance_url?: string;
  rating: number;
  total_trips: number;
  earnings: number;
  is_online: boolean;
  current_location?: {
    latitude: number;
    longitude: number;
  };
  created_at: string;
  updated_at: string;
}

// User types
export interface AppUser {
  id: string;
  email: string;
  phone?: string;
  full_name: string;
  avatar_url?: string;
  role: 'user' | 'operator';
  is_active: boolean;
  total_trips: number;
  created_at: string;
  last_login?: string;
}

// Tow Request types
export type RequestStatus = 
  | 'pending' 
  | 'accepted' 
  | 'en_route' 
  | 'arrived' 
  | 'in_progress' 
  | 'completed' 
  | 'cancelled';

export interface TowRequest {
  id: string;
  user_id: string;
  user_name: string;
  user_phone: string;
  operator_id?: string;
  operator_name?: string;
  pickup_location: {
    address: string;
    latitude: number;
    longitude: number;
  };
  destination: {
    address: string;
    latitude: number;
    longitude: number;
  };
  vehicle_type: string;
  vehicle_details?: {
    make?: string;
    model?: string;
    plate_number?: string;
  };
  status: RequestStatus;
  estimated_price: number;
  final_price?: number;
  distance_km: number;
  payment_status?: 'pending' | 'paid' | 'refunded';
  payment_method?: string;
  created_at: string;
  accepted_at?: string;
  started_at?: string;
  completed_at?: string;
  cancelled_at?: string;
  cancellation_reason?: string;
}

// Vehicle Pricing types
export interface VehiclePricing {
  id: string;
  vehicle_type: string;
  base_price: number;
  price_per_km: number;
  icon?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PricingConfig {
  id: string;
  vehicle_type: string;
  base_fee: number;
  per_km_rate: number;
  is_active: boolean;
}

// Analytics types
export interface DashboardStats {
  totalUsers: number;
  totalOperators: number;
  totalRequests: number;
  totalRevenue: number;
  pendingOperators: number;
  activeRequests: number;
  todayRequests: number;
  todayRevenue: number;
}

export interface ChartData {
  name: string;
  value: number;
}

export interface RevenueData {
  date: string;
  revenue: number;
  trips: number;
}

// Notification types
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  target: 'all' | 'users' | 'operators';
  is_read: boolean;
  created_at: string;
}

// Support Ticket types
export interface SupportTicket {
  id: string;
  user_id: string;
  user_name: string;
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigned_to?: string;
  created_at: string;
  updated_at: string;
}

// Payment/Refund types
export interface Payment {
  id: string;
  request_id: string;
  user_id: string;
  operator_id: string;
  amount: number;
  status: 'pending' | 'completed' | 'refunded' | 'failed';
  payment_method: string;
  transaction_reference?: string;
  refund_reason?: string;
  refunded_at?: string;
  created_at: string;
}
