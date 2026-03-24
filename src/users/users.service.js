"use strict";
// ═══════════════════════════════════════════════════════════
// USERS SERVICE — Managing your team
// Plain English: This handles adding new team members,
// assigning their roles, and managing their accounts.
// Only an Admin can add or change users.
// ═══════════════════════════════════════════════════════════
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../common/prisma.service");
const bcrypt = __importStar(require("bcrypt"));
@(0, common_1.Injectable)()
class UsersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    // ── INVITE NEW TEAM MEMBER ────────────────────────────
    // Plain English: Admin adds a new person. The system
    // creates their account with a temporary password and
    // flags it for a password change on first login.
    async invite(companyId, invitedBy, data) {
        // Check if email already exists
        const existing = await this.prisma.user.findUnique({
            where: { email: data.email.toLowerCase() },
        });
        if (existing) {
            throw new common_1.ConflictException('A user with this email already exists');
        }
        // Generate a temporary password
        // Plain English: A random password they must change on first login
        const tempPassword = this.generateTempPassword();
        const passwordHash = await bcrypt.hash(tempPassword, 12);
        const user = await this.prisma.user.create({
            data: {
                companyId,
                name: data.name,
                email: data.email.toLowerCase().trim(),
                passwordHash,
                role: data.role,
                mustChangePassword: true, // Forces password change on first login
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
            },
        });
        // Log who invited whom
        await this.prisma.auditLog.create({
            data: {
                userId: invitedBy,
                action: 'USER_INVITED',
                tableName: 'users',
                recordId: user.id,
                newValues: { name: data.name, email: data.email, role: data.role },
            },
        });
        // In production: send welcome email with temp password via Resend
        // For now: return temp password so admin can share it securely
        return {
            user,
            tempPassword, // Admin shares this with the new team member
            message: `Account created. Share the temporary password with ${data.name} and ask them to change it on first login.`,
        };
    }
    // ── LIST ALL TEAM MEMBERS ─────────────────────────────
    async findAll(companyId) {
        return this.prisma.user.findMany({
            where: { companyId, deletedAt: null },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                isActive: true,
                lastLoginAt: true,
                createdAt: true,
            },
            orderBy: { name: 'asc' },
        });
    }
    // ── CHANGE ROLE ───────────────────────────────────────
    async changeRole(userId, newRole, changedBy) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        const oldRole = user.role;
        await this.prisma.user.update({
            where: { id: userId },
            data: { role: newRole },
        });
        // Audit log — who changed whose role and what it changed from/to
        await this.prisma.auditLog.create({
            data: {
                userId: changedBy,
                action: 'ROLE_CHANGED',
                tableName: 'users',
                recordId: userId,
                oldValues: { role: oldRole },
                newValues: { role: newRole },
            },
        });
        return { message: `${user.name}'s role updated to ${newRole}` };
    }
    // ── DEACTIVATE USER ───────────────────────────────────
    // Plain English: When someone leaves the company,
    // their account is deactivated — not deleted.
    // Their records and audit history are preserved.
    async deactivate(userId, deactivatedBy) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        await this.prisma.user.update({
            where: { id: userId },
            data: {
                isActive: false,
                deletedAt: new Date(),
            },
        });
        // Revoke all active sessions immediately
        await this.prisma.refreshToken.updateMany({
            where: { userId, isRevoked: false },
            data: { isRevoked: true },
        });
        await this.prisma.auditLog.create({
            data: {
                userId: deactivatedBy,
                action: 'USER_DEACTIVATED',
                tableName: 'users',
                recordId: userId,
                newValues: { name: user.name, email: user.email },
            },
        });
        return { message: `${user.name}'s account has been deactivated` };
    }
    generateTempPassword() {
        // Generates something like "Biz@2843" — easy to type, hard to guess
        const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
        let password = '';
        for (let i = 0; i < 8; i++) {
            password += chars[Math.floor(Math.random() * chars.length)];
        }
        return 'Biz@' + password;
    }
}
exports.UsersService = UsersService;
//# sourceMappingURL=users.service.js.map