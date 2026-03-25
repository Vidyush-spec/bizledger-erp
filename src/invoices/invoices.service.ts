import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class InvoicesService {
  constructor(private prisma: PrismaService) {}

  async findAll(companyId: string, status?: string) {
    return this.prisma.invoice.findMany({
      where: {
        companyId,
        deletedAt: null,
        ...(status ? { status: status as any } : {}),
      },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, companyId: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id, companyId, deletedAt: null },
      include: { items: true },
    });
    if (!invoice) throw new NotFoundException('Invoice not found');
    return invoice;
  }

  async create(data: any, userId: string, companyId: string) {
    const { items, ...invoiceData } = data;
    return this.prisma.invoice.create({
      data: {
        ...invoiceData,
        companyId,
        createdBy: userId,
        items: { create: items || [] },
      },
      include: { items: true },
    });
  }

  async update(id: string, data: any, companyId: string) {
    await this.findOne(id, companyId);
    const { items, ...invoiceData } = data;
    if (items !== undefined) {
      await this.prisma.invoiceItem.deleteMany({ where: { invoiceId: id } });
    }
    return this.prisma.invoice.update({
      where: { id },
      data: {
        ...invoiceData,
        ...(items !== undefined ? { items: { create: items } } : {}),
      },
      include: { items: true },
    });
  }

  async delete(id: string, companyId: string) {
    await this.findOne(id, companyId);
    return this.prisma.invoice.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}