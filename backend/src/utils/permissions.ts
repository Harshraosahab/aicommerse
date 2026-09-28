import { UserRole } from '../models/user.model.js';

export type AdminPermission =
  | 'ALL'
  | 'MANAGE_PRODUCTS'
  | 'MANAGE_CATEGORIES'
  | 'MANAGE_BRANDS'
  | 'MANAGE_INVENTORY'
  | 'MANAGE_ORDERS'
  | 'MANAGE_PAYMENTS'
  | 'MANAGE_RETURNS'
  | 'MANAGE_REFUNDS'
  | 'MANAGE_USERS'
  | 'MANAGE_REVIEWS'
  | 'MANAGE_COUPONS'
  | 'MANAGE_MARKETING'
  | 'MANAGE_SUPPORT'
  | 'MANAGE_SETTINGS'
  | 'VIEW_AUDIT_LOGS'
  | 'VIEW_ANALYTICS';

const ROLE_PERMISSIONS: Record<UserRole, AdminPermission[]> = {
  SUPER_ADMIN: ['ALL'],
  ADMIN: ['ALL'],
  PRODUCT_MANAGER: [
    'MANAGE_PRODUCTS',
    'MANAGE_CATEGORIES',
    'MANAGE_BRANDS',
    'MANAGE_INVENTORY',
    'VIEW_ANALYTICS',
  ],
  ORDER_MANAGER: [
    'MANAGE_ORDERS',
    'MANAGE_PAYMENTS',
    'MANAGE_RETURNS',
    'MANAGE_REFUNDS',
    'MANAGE_INVENTORY',
    'VIEW_ANALYTICS',
  ],
  SUPPORT_MANAGER: [
    'MANAGE_SUPPORT',
    'MANAGE_REVIEWS',
    'MANAGE_ORDERS',
    'MANAGE_RETURNS',
  ],
  MARKETING_MANAGER: [
    'MANAGE_COUPONS',
    'MANAGE_MARKETING',
    'VIEW_ANALYTICS',
  ],
  MODERATOR: [
    'MANAGE_REVIEWS',
  ],
  USER: [],
};

export const ADMINISTRATIVE_ROLES: UserRole[] = [
  'ADMIN',
  'SUPER_ADMIN',
  'PRODUCT_MANAGER',
  'ORDER_MANAGER',
  'SUPPORT_MANAGER',
  'MARKETING_MANAGER',
  'MODERATOR',
];

export function hasPermission(role: UserRole, permission: AdminPermission): boolean {
  const perms = ROLE_PERMISSIONS[role] || [];
  if (perms.includes('ALL')) return true;
  return perms.includes(permission);
}

export function isAdministrativeRole(role: UserRole): boolean {
  return ADMINISTRATIVE_ROLES.includes(role);
}
