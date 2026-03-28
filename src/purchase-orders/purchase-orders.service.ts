import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class PurchaseOrdersService {
  constructor(private prisma: PrismaService) {}

  async findAll(companyId: string) {
    return this.prisma.purchaseOrder.findMany({
      where: { companyId },
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, companyId: string) {
    const po = await this.prisma.purchaseOrder.findFirst({
      where: { id, companyId },
      include: { items: { include: { product: true } } },
    });
    if (!po) throw new NotFoundException('Purchase order not found');
    return po;
  }

  async create(companyId: string, body: any) {
    const count = await this.prisma.purchaseOrder.count({ where: { companyId } });
    const poNo = 'PO-' + String(count + 1).padStart(4, '0');
    return this.prisma.purchaseOrder.create({
      data: {
        companyId,
        poNo,
        vendorName: body.vendorName,
        vendorGstin: body.vendorGstin || null,
        orderDate: new Date(body.orderDate),
        expectedDate: body.expectedDate ? new Date(body.expectedDate) : null,
        totalAmount: body.totalAmount,
        notes: body.notes || null,
        status: 'ORDERED',
        items: {
          create: body.items.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            rate: item.rate,
            receivedQty: 0,
          })),
        },
      },
      include: { items: { include: { product: true } } },
    });
  }

  async updateStatus(id: string, companyId: string, status: string) {
    const po = await this.prisma.purchaseOrder.findFirst({ where: { id, companyId } });
    if (!po) throw new NotFoundException('Purchase order not found');
    return this.prisma.purchaseOrder.update({
      where: { id },
      data: { status: status as any },
    });
  }
}
