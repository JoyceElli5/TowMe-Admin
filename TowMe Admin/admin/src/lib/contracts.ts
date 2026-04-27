export const ADMIN_ROLES = [
  'super_admin',
  'ops_admin',
  'support_admin',
  'finance_admin',
  'risk_admin',
  'operator_manager',
  'support_staff',
] as const;

export type AdminRole = (typeof ADMIN_ROLES)[number];

export const OPERATOR_STATUSES = ['pending', 'approved', 'rejected', 'suspended'] as const;
export type OperatorStatus = (typeof OPERATOR_STATUSES)[number];

export const USER_ROLES = ['user', 'operator'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const USER_MODERATION_STATUSES = ['active', 'soft_banned', 'permanently_banned'] as const;
export type UserModerationStatus = (typeof USER_MODERATION_STATUSES)[number];

export const USER_MODERATION_ACTIONS = ['soft_ban', 'permanent_ban', 'unblock', 'reset_auth'] as const;
export type UserModerationAction = (typeof USER_MODERATION_ACTIONS)[number];

export const REQUEST_STATUSES = [
  'pending',
  'accepted',
  'en_route',
  'arrived',
  'in_progress',
  'completed',
  'cancelled',
] as const;
export type RequestStatus = (typeof REQUEST_STATUSES)[number];

export const REQUEST_INTERVENTION_ACTIONS = [
  'cancel',
  'reassign',
  'escalate',
  'mark_fraud',
  'emergency_override',
] as const;
export type RequestInterventionAction = (typeof REQUEST_INTERVENTION_ACTIONS)[number];

export const REQUEST_PAYMENT_STATUSES = ['pending', 'paid', 'refunded'] as const;
export type RequestPaymentStatus = (typeof REQUEST_PAYMENT_STATUSES)[number];

export const NOTIFICATION_TYPES = ['operator', 'user', 'payment', 'request', 'system'] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const NOTIFICATION_TARGETS = ['all', 'users', 'operators'] as const;
export type NotificationTarget = (typeof NOTIFICATION_TARGETS)[number];

export const NOTIFICATION_SEVERITIES = ['low', 'medium', 'high'] as const;
export type NotificationSeverity = (typeof NOTIFICATION_SEVERITIES)[number];

export const SUPPORT_CATEGORIES = ['general', 'payment', 'technical', 'complaint', 'dispute'] as const;
export type SupportCategory = (typeof SUPPORT_CATEGORIES)[number];

export const SUPPORT_STATUSES = ['open', 'in_progress', 'resolved', 'closed'] as const;
export type SupportStatus = (typeof SUPPORT_STATUSES)[number];

export const SUPPORT_PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;
export type SupportPriority = (typeof SUPPORT_PRIORITIES)[number];

export const PAYMENT_STATUSES = ['pending', 'completed', 'refunded', 'failed'] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];