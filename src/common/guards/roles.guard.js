"use strict";
// ═══════════════════════════════════════════════════════════
// ROLES GUARD — The access control system
// Plain English: Before anyone reaches a page or does an action,
// this guard checks their role. An HR Manager trying to open
// the Accounting module gets blocked here automatically.
// ═══════════════════════════════════════════════════════════
Object.defineProperty(exports, "__esModule", { value: true });
exports.RolesGuard = exports.RequirePermissions = exports.PERMISSIONS_KEY = exports.RequireRoles = exports.ROLES_KEY = exports.ROLE_PERMISSIONS = exports.Role = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
var Role;
(function (Role) {
    Role["ADMIN"] = "ADMIN";
    Role["ACCOUNTANT"] = "ACCOUNTANT";
    Role["HR_MANAGER"] = "HR_MANAGER";
    Role["INVENTORY_MANAGER"] = "INVENTORY_MANAGER";
    Role["VIEWER"] = "VIEWER";
})(Role || (exports.Role = Role = {}));
// What each role is allowed to access
// Plain English: This is the access control matrix —
// think of it as the key chart on the wall of your office.
exports.ROLE_PERMISSIONS = {
    [Role.ADMIN]: ['*'], // Admin can do everything
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
exports.ROLES_KEY = 'roles';
const RequireRoles = (...roles) => {
    return (target, key, descriptor) => {
        Reflect.defineMetadata(exports.ROLES_KEY, roles, descriptor?.value ?? target);
        return descriptor ?? target;
    };
};
exports.RequireRoles = RequireRoles;
exports.PERMISSIONS_KEY = 'permissions';
const RequirePermissions = (...permissions) => {
    return (target, key, descriptor) => {
        Reflect.defineMetadata(exports.PERMISSIONS_KEY, permissions, descriptor?.value ?? target);
        return descriptor ?? target;
    };
};
exports.RequirePermissions = RequirePermissions;
@(0, common_1.Injectable)()
class RolesGuard {
    reflector;
    constructor(reflector) {
        this.reflector = reflector;
    }
    canActivate(context) {
        const requiredRoles = this.reflector.getAllAndOverride(exports.ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        const requiredPermissions = this.reflector.getAllAndOverride(exports.PERMISSIONS_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        // If no roles or permissions required, allow access
        if (!requiredRoles && !requiredPermissions)
            return true;
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        if (!user)
            throw new common_1.ForbiddenException('Not authenticated');
        // Admin bypasses all checks
        if (user.role === Role.ADMIN)
            return true;
        // Check role requirement
        if (requiredRoles && !requiredRoles.includes(user.role)) {
            throw new common_1.ForbiddenException(`Access denied. This section requires: ${requiredRoles.join(' or ')} role.`);
        }
        // Check permission requirement
        if (requiredPermissions) {
            const userPermissions = exports.ROLE_PERMISSIONS[user.role] || [];
            const hasPermission = requiredPermissions.every(p => userPermissions.includes(p));
            if (!hasPermission) {
                throw new common_1.ForbiddenException('You do not have permission to perform this action.');
            }
        }
        return true;
    }
}
exports.RolesGuard = RolesGuard;
//# sourceMappingURL=roles.guard.js.map