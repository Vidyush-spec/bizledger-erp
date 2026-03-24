
// ═══════════════════════════════════════════════════════════
// USERS SERVICE — Managing your team
// Plain English: This handles adding new team members,
// assigning their roles, and managing their accounts.
// Only an Admin can add or change users.
// ═══════════════════════════════════════════════════════════

import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  // ── INVITE NEW TEAM MEMBER ────────────────────────────
  // Plain English: Admin adds a new person. The system
  // creates their account with a temporary password and
  // flags it for a password change on first login.
  async invite(companyId: string, invitedBy: string, data: {
    name: string;
    email: string;
    role: string;
  }) {
    // Check if email already exists
    const existing = await this.prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });
    if (existing) {
      throw new ConflictException('A user with this email already exists');
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
        role: data.role as any,
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
  async findAll(companyId: string) {
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
  async changeRole(userId: string, newRole: string, changedBy: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const oldRole = user.role;

    await this.prisma.user.update({
      where: { id: userId },
      data: { role: newRole as any },
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
  async deactivate(userId: string, deactivatedBy: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

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

  private generateTempPassword(): string {
    // Generates something like "Biz@2843" — easy to type, hard to guess
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars[Math.floor(Math.random() * chars.length)];
    }
    return 'Biz@' + password;
  }
}
