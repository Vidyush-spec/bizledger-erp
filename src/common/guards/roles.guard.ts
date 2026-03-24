// ═══════════════════════════════════════════════════════════
// ROLES GUARD — The access control system
// Plain English: Before anyone reaches a page or does an action,
// this guard checks their role. An HR Manager trying to open
// the Accounting module gets blocked here automatically.
// ═══════════════════════════════════════════════════════════

import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export enum Role {
  ADMIN              = 'ADMIN',
  ACCOUNTANT         = 'ACCOUNTANT',
  HR_MANAGER         = 'HR_MANAGER',
  INVENTORY_MANAGER  = 'INVENTORY_MANAGER',
  VIEWER             = 'VIEWER',
}

// What each role is allowed to access
// Plain English: This is the access control matrix —
// think of it as the key chart on the wall of your office.
export const ROLE_PERMISSIONS: Record<Role, string[]> = {
  [Role.ADMIN]: ['*'],  // Admin can do everything

  [Role.ACCOUNTANT]: [
    'accounting:read', 'accounting:write',
    'gst:read', 'gst:write',
    'invoices:read', 'invoices:write',
    'reports:read',
    'dashboard:read',
  ],

  [Role.HR_MANAGER]: [
    'payroll:read', 'payroll:write',
    'employees:read', 'employees:write',
    'reports:read',
    'dashboard:read',
  ],

  [Role.INVENTORY_MANAGER]: [
    'inventory:read', 'inventory:write',
    'purchase_orders:read', 'purchase_orders:write',
    'reports:read',
    'dashboard:read',
  ],

  [Role.VIEWER]: [
    'accounting:read',
    'gst:read',
    'invoices:read',
    'inventory:read',
    'payroll:read',
    'reports:read',
    'dashboard:read',
  ],
};

export const ROLES_KEY = 'roles';
export const RequireRoles = (...roles: Role[]) => {
  return (target: any, key?: any, descriptor?: any) => {
    Reflect.defineMetadata(ROLES_KEY, roles, descriptor?.value ?? target);
    return descriptor ?? target;
  };
};

export const PERMISSIONS_KEY = 'permissions';
export const RequirePermissions = (...permissions: string[]) => {
  return (target: any, key?: any, descriptor?: any) => {
    Reflect.defineMetadata(PERMISSIONS_KEY, permissions, descriptor?.value ?? target);
    return descriptor ?? target;
  };
};

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no roles or permissions required, allow access
    if (!requiredRoles && !requiredPermissions) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) throw new ForbiddenException('Not authenticated');

    // Admin bypasses all checks
    if (user.role === Role.ADMIN) return true;

    // Check role requirement
    if (requiredRoles && !requiredRoles.includes(user.role)) {
      throw new ForbiddenException(
        `Access denied. This section requires: ${requiredRoles.join(' or ')} role.`
      );
    }

    // Check permission requirement
    if (requiredPermissions) {
      const userPermissions = ROLE_PERMISSIONS[user.role as Role] || [];
      const hasPermission = requiredPermissions.every(p => userPermissions.includes(p));
      if (!hasPermission) {
        throw new ForbiddenException(
          'You do not have permission to perform this action.'
        );
      }
    }

    return true;
  }
}
