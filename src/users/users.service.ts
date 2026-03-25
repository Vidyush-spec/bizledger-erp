import { Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(companyId: string) {
    return this.prisma.user.findMany({
      where: { companyId, deletedAt: null },
      select: {
        id: true, email: true, name: true,
        role: true, isActive: true, lastLoginAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, companyId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, companyId, deletedAt: null },
      select: {
        id: true, email: true, name: true,
        role: true, isActive: true, lastLoginAt: true,
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async create(data: any, companyId: string) {
    const hash = await bcrypt.hash(data.password, 12);
    return this.prisma.user.create({
      data: {
        email: data.email.toLowerCase().trim(),
        name: data.name,
        passwordHash: hash,
        role: data.role || 'VIEWER',
        companyId,
        isActive: true,
        mustChangePassword: true,
      },
      select: { id: true, email: true, name: true, role: true, isActive: true },
    });
  }

  async update(id: string, data: any, companyId: string) {
    await this.findOne(id, companyId);
    const updateData: any = {};
    if (data.name) updateData.name = data.name;
    if (data.role) updateData.role = data.role;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.password) updateData.passwordHash = await bcrypt.hash(data.password, 12);
    return this.prisma.user.update({
      where: { id },
      data: updateData,
      select: { id: true, email: true, name: true, role: true, isActive: true },
    });
  }
}