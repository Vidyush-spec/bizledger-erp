import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class EmployeesService {
  constructor(private prisma: PrismaService) {}

  async findAll(companyId: string) {
    return this.prisma.employee.findMany({
      where: { companyId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, companyId: string) {
    const emp = await this.prisma.employee.findFirst({
      where: { id, companyId, deletedAt: null },
    });
    if (!emp) throw new NotFoundException('Employee not found');
    return emp;
  }

  async create(data: any, companyId: string) {
    return this.prisma.employee.create({
      data: { ...data, companyId },
    });
  }

  async update(id: string, data: any, companyId: string) {
    await this.findOne(id, companyId);
    return this.prisma.employee.update({ where: { id }, data });
  }

  async delete(id: string, companyId: string) {
    await this.findOne(id, companyId);
    return this.prisma.employee.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }
}