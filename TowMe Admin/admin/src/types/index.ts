import type {
  AdminRole,
  NotificationSeverity,
  NotificationTarget,
  NotificationType,
  OperatorStatus,
  PaymentStatus,
  RequestInterventionAction,
  RequestPaymentStatus,
  RequestStatus,
  SupportCategory,
  SupportPriority,
  SupportStatus,
  UserModerationAction,
  UserModerationStatus,
  UserRole,
} from '../lib/contracts';

// Admin user roles
export type { AdminRole, RequestInterventionAction, RequestStatus, UserModerationAction };

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
  status: OperatorStatus;
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
  role: UserRole;
  is_active: boolean;
  moderation_status?: UserModerationStatus;
  ban_reason?: string;
  banned_at?: string;
  total_trips: number;
  created_at: string;
  last_login?: string;
}

// Tow Request types

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
  payment_status?: RequestPaymentStatus;
  payment_method?: string;
  created_at: string;
  accepted_at?: string;
  started_at?: string;
  completed_at?: string;
  cancelled_at?: string;
  cancellation_reason?: string;
  is_escalated?: boolean;
  escalated_at?: string;
  is_fraud_suspected?: boolean;
  emergency_override?: boolean;
  intervention_notes?: string;
  eta_minutes?: number;
  route_progress_percent?: number;
  operator_location?: {
    latitude: number;
    longitude: number;
    heading?: number;
    speed_kmh?: number;
    updated_at?: string;
  };
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
  service_fee?: number;
  surge_multiplier?: number;
  zone_multiplier?: number;
  effective_from?: string;
  is_active: boolean;
}

export interface PricingVersion {
  id: string;
  pricing_id: string;
  vehicle_type: string;
  base_fee: number;
  per_km_rate: number;
  service_fee?: number;
  surge_multiplier?: number;
  zone_multiplier?: number;
  effective_from: string;
  changed_at: string;
  changed_by?: string;
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
  type: NotificationType;
  target: NotificationTarget;
  is_read: boolean;
  read_at?: string;
  severity?: NotificationSeverity;
  action_url?: string;
  created_at: string;
}

export interface AdminSettings {
  profile: {
    name: string;
    email: string;
    phone?: string;
    avatar_url?: string | null;
  };
  notifications: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    newOperators: boolean;
    newRequests: boolean;
    payments: boolean;
    systemAlerts: boolean;
  };
  system: {
    language: string;
    timezone: string;
    currency: string;
  };
}

export interface AuditLogRecord {
  id: string;
  action: string;
  resource_type: string;
  resource_id: string;
  actor_id?: string;
  before?: unknown;
  after?: unknown;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

export interface RevenuePoint {
  date: string;
  revenue: number;
  trips: number;
}

// Support Ticket types
export interface SupportTicket {
  id: string;
  user_id: string;
  user_name: string;
  user_email?: string;
  subject: string;
  message: string;
  category: SupportCategory;
  status: SupportStatus;
  priority: SupportPriority;
  assigned_to?: string;
  assigned_to_name?: string;
  linked_request_id?: string;
  linked_payment_id?: string;
  dispute_id?: string;
  sla_due_at?: string;
  resolution_summary?: string;
  last_reply_at?: string;
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
  status: PaymentStatus;
  payment_method: string;
  transaction_reference?: string;
  refund_reason?: string;
  refunded_at?: string;
  created_at: string;
}
