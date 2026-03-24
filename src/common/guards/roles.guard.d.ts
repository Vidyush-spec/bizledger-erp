import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
export declare enum Role {
    ADMIN = "ADMIN",
    ACCOUNTANT = "ACCOUNTANT",
    HR_MANAGER = "HR_MANAGER",
    INVENTORY_MANAGER = "INVENTORY_MANAGER",
    VIEWER = "VIEWER"
}
export declare const ROLE_PERMISSIONS: Record<Role, string[]>;
export declare const ROLES_KEY = "roles";
export declare const RequireRoles: (...roles: Role[]) => (target: any, key?: any, descriptor?: any) => any;
export declare const PERMISSIONS_KEY = "permissions";
export declare const RequirePermissions: (...permissions: string[]) => (target: any, key?: any, descriptor?: any) => any;
export declare class RolesGuard implements CanActivate {
    private reflector;
    constructor(reflector: Reflector);
    canActivate(context: ExecutionContext): boolean;
}
//# sourceMappingURL=roles.guard.d.ts.map