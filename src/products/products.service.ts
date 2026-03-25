import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async findAll(companyId: string) {
    return this.prisma.product.findMany({
      where: { companyId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, companyId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, companyId, deletedAt: null },
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async create(data: any, companyId: string) {
    return this.prisma.product.create({
      data: { ...data, companyId },
    });
  }

  async update(id: string, data: any, companyId: string) {
    await this.findOne(id, companyId);
    return this.prisma.product.update({ where: { id }, data });
  }

  async delete(id: string, companyId: string) {
    await this.findOne(id, companyId);
    return this.prisma.product.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }
}