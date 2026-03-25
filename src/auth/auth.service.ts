import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new UnauthorizedException('Account is temporarily locked. Try again later.');
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      const failedLogins = user.failedLogins + 1;
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          failedLogins,
          lockedUntil: failedLogins >= 5
            ? new Date(Date.now() + 15 * 60 * 1000)
            : null,
        },
      });
      throw new UnauthorizedException('Invalid email or password');
    }
    if (!user.isActive) {
      throw new UnauthorizedException('Account is disabled. Contact your administrator.');
    }
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        failedLogins: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
      },
    });
    const payload = { sub: user.id, email: user.email, role: user.role, companyId: user.companyId };
    const token = this.jwt.sign(payload);
    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        companyId: user.companyId,
        mustChangePassword: user.mustChangePassword,
        avatar: user.name
          .split(' ')
          .map((n: string) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2),
      },
    };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        companyId: true,
        isActive: true,
        lastLoginAt: true,
        mustChangePassword: true,
      },
    });
    if (!user) throw new UnauthorizedException('User not found');
    return {
      ...user,
      avatar: user.name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2),
    };
  }
}