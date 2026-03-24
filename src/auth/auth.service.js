"use strict";
// ═══════════════════════════════════════════════════════════
// AUTH SERVICE — The security desk of your ERP
// Plain English: This handles everything about logging in:
// checking passwords, issuing tokens, refreshing sessions,
// and locking out attackers.
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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const prisma_service_1 = require("../common/prisma.service");
const bcrypt = __importStar(require("bcrypt"));
const crypto_1 = require("crypto");
@(0, common_1.Injectable)()
class AuthService {
    prisma;
    jwt;
    constructor(prisma, jwt) {
        this.prisma = prisma;
        this.jwt = jwt;
    }
    // ── LOGIN ──────────────────────────────────────────────
    // Plain English: Check email + password. If correct,
    // issue two tokens: a short-lived access token (15 min)
    // and a long-lived refresh token (7 days).
    async login(email, password, ipAddress) {
        // 1. Find the user
        const user = await this.prisma.user.findUnique({
            where: { email: email.toLowerCase().trim() },
            include: { company: true },
        });
        if (!user) {
            // Don't reveal whether email exists — same error for both cases
            throw new common_1.UnauthorizedException('Invalid email or password');
        }
        // 2. Check if account is locked out
        if (user.lockedUntil && user.lockedUntil > new Date()) {
            const minutesLeft = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
            throw new common_1.ForbiddenException(`Account locked. Try again in ${minutesLeft} minutes.`);
        }
        // 3. Check if user is active
        if (!user.isActive) {
            throw new common_1.ForbiddenException('Your account has been deactivated. Contact your administrator.');
        }
        // 4. Verify password
        // Plain English: Compare what was typed against the scrambled version stored.
        const passwordCorrect = await bcrypt.compare(password, user.passwordHash);
        if (!passwordCorrect) {
            // Increment failed attempts
            const newFailedCount = user.failedLogins + 1;
            const maxAttempts = parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5');
            await this.prisma.user.update({
                where: { id: user.id },
                data: {
                    failedLogins: newFailedCount,
                    // Lock the account if too many failures
                    lockedUntil: newFailedCount >= maxAttempts
                        ? new Date(Date.now() + parseInt(process.env.LOCKOUT_MINUTES || '15') * 60000)
                        : null,
                },
            });
            const remaining = maxAttempts - newFailedCount;
            if (remaining <= 0) {
                throw new common_1.ForbiddenException('Too many failed attempts. Account locked for 15 minutes.');
            }
            throw new common_1.UnauthorizedException(`Invalid email or password. ${remaining} attempt(s) remaining.`);
        }
        // 5. Password correct — reset failed counter, update last login
        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                failedLogins: 0,
                lockedUntil: null,
                lastLoginAt: new Date(),
                lastLoginIp: ipAddress,
            },
        });
        // 6. Generate tokens
        const tokens = await this.generateTokens(user.id, user.email, user.role, user.companyId);
        // 7. Log the login in the audit trail
        await this.prisma.auditLog.create({
            data: {
                userId: user.id,
                action: 'USER_LOGIN',
                tableName: 'users',
                recordId: user.id,
                ipAddress,
                newValues: { email: user.email, role: user.role },
            },
        });
        return {
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                company: {
                    id: user.company.id,
                    name: user.company.name,
                    gstin: user.company.gstin,
                },
                mustChangePassword: user.mustChangePassword,
            },
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
        };
    }
    // ── REFRESH SESSION ───────────────────────────────────
    // Plain English: When the 15-minute access token expires,
    // the app quietly uses the 7-day refresh token to get a
    // new access token — without asking you to log in again.
    async refresh(refreshToken, ipAddress) {
        const tokenHash = this.hashToken(refreshToken);
        const stored = await this.prisma.refreshToken.findUnique({
            where: { tokenHash },
            include: { user: true },
        });
        if (!stored || stored.isRevoked || stored.expiresAt < new Date()) {
            throw new common_1.UnauthorizedException('Session expired. Please log in again.');
        }
        // Revoke the old refresh token (rotation — prevents reuse)
        await this.prisma.refreshToken.update({
            where: { id: stored.id },
            data: { isRevoked: true },
        });
        // Issue fresh tokens
        return this.generateTokens(stored.user.id, stored.user.email, stored.user.role, stored.user.companyId);
    }
    // ── LOGOUT ────────────────────────────────────────────
    // Plain English: Cancels all the login tokens immediately.
    // Even if someone stole your token, it becomes useless.
    async logout(userId, ipAddress) {
        // Revoke all refresh tokens for this user
        await this.prisma.refreshToken.updateMany({
            where: { userId, isRevoked: false },
            data: { isRevoked: true },
        });
        await this.prisma.auditLog.create({
            data: {
                userId,
                action: 'USER_LOGOUT',
                tableName: 'users',
                recordId: userId,
                ipAddress,
            },
        });
        return { message: 'Logged out successfully' };
    }
    // ── CHANGE PASSWORD ───────────────────────────────────
    async changePassword(userId, currentPassword, newPassword) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        const correct = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!correct)
            throw new common_1.BadRequestException('Current password is incorrect');
        // Enforce strong password rules
        if (newPassword.length < 8) {
            throw new common_1.BadRequestException('Password must be at least 8 characters');
        }
        if (!/[A-Z]/.test(newPassword)) {
            throw new common_1.BadRequestException('Password must contain at least one uppercase letter');
        }
        if (!/[0-9]/.test(newPassword)) {
            throw new common_1.BadRequestException('Password must contain at least one number');
        }
        const newHash = await bcrypt.hash(newPassword, 12);
        await this.prisma.user.update({
            where: { id: userId },
            data: { passwordHash: newHash, mustChangePassword: false },
        });
        // Revoke all existing refresh tokens — force re-login on all devices
        await this.prisma.refreshToken.updateMany({
            where: { userId, isRevoked: false },
            data: { isRevoked: true },
        });
        return { message: 'Password changed successfully. Please log in again.' };
    }
    // ── HELPERS ───────────────────────────────────────────
    async generateTokens(userId, email, role, companyId) {
        const payload = { sub: userId, email, role, companyId };
        const accessToken = this.jwt.sign(payload, {
            secret: process.env.JWT_ACCESS_SECRET,
            expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m',
        });
        const refreshToken = this.generateSecureToken();
        const tokenHash = this.hashToken(refreshToken);
        await this.prisma.refreshToken.create({
            data: {
                userId,
                tokenHash,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            },
        });
        return { accessToken, refreshToken };
    }
    generateSecureToken() {
        // Generates a cryptographically random token
        return require('crypto').randomBytes(64).toString('hex');
    }
    hashToken(token) {
        // Never store raw tokens — always store the hash
        return (0, crypto_1.createHash)('sha256').update(token).digest('hex');
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=auth.service.js.map