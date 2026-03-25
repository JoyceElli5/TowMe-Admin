import type { AdminRole } from '../types';

export type AdminPermission =
  | 'dashboard.view'
  | 'operators.view'
  | 'operators.verify'
  | 'operators.suspend'
  | 'requests.view'
  | 'requests.intervene'
  | 'users.view'
  | 'users.moderate'
  | 'pricing.view'
  | 'pricing.manage'
  | 'finance.view'
  | 'finance.manage_refunds'
  | 'support.view'
  | 'support.manage'
  | 'notifications.view'
  | 'notifications.manage'
  | 'settings.view'
  | 'audit.view';

const allPermissions: AdminPermission[] = [
  'dashboard.view',
  'operators.view',
  'operators.verify',
  'operators.suspend',
  'requests.view',
  'requests.intervene',
  'users.view',
  'users.moderate',
  'pricing.view',
  'pricing.manage',
  'finance.view',
  'finance.manage_refunds',
  'support.view',
  'support.manage',
  'notifications.view',
  'notifications.manage',
  'settings.view',
  'audit.view',
];

const rolePermissions: Record<AdminRole, AdminPermission[]> = {
  super_admin: allPermissions,
  ops_admin: [
    'dashboard.view',
    'operators.view',
    'operators.verify',
    'operators.suspend',
    'requests.view',
    'requests.intervene',
    'users.view',
    'users.moderate',
    'pricing.view',
    'pricing.manage',
    'support.view',
    'notifications.view',
    'settings.view',
  ],
  support_admin: [
    'dashboard.view',
    'requests.view',
    'users.view',
    'users.moderate',
    'support.view',
    'support.manage',
    'notifications.view',
    'settings.view',
  ],
  finance_admin: [
    'dashboard.view',
    'finance.view',
    'finance.manage_refunds',
    'pricing.view',
    'settings.view',
    'audit.view',
  ],
  risk_admin: [
    'dashboard.view',
    'operators.view',
    'operators.suspend',
    'requests.view',
    'requests.intervene',
    'users.view',
    'users.moderate',
    'audit.view',
    'settings.view',
  ],
  // Legacy roles maintained for backward compatibility.
  operator_manager: [
    'dashboard.view',
    'operators.view',
    'operators.verify',
    'operators.suspend',
    'requests.view',
    'requests.intervene',
    'users.view',
    'pricing.view',
    'settings.view',
  ],
  support_staff: [
    'dashboard.view',
    'requests.view',
    'users.view',
    'support.view',
    'support.manage',
    'notifications.view',
    'settings.view',
  ],
};

export function getPermissionsForRole(role: AdminRole): AdminPermission[] {
  return rolePermissions[role] || [];
}

export function roleHasPermission(role: AdminRole, permission: AdminPermission): boolean {
  return getPermissionsForRole(role).includes(permission);
}

export function roleHasAnyPermission(role: AdminRole, permissions: AdminPermission[]): boolean {
  return permissions.some((permission) => roleHasPermission(role, permission));
}
