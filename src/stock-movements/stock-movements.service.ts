import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class StockMovementsService {
  constructor(private prisma: PrismaService) {}

  async findAll(companyId: string) {
    return this.prisma.stockMovement.findMany({
      where: { product: { companyId } },
      include: { product: { select: { id: true, name: true, sku: true, unit: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async create(companyId: string, body: any) {
    const product = await this.prisma.product.findFirst({
      where: { id: body.productId, companyId },
    });
    if (!product) throw new NotFoundException('Product not found');

    const qty = Number(body.quantity);
    const type = body.type as string;
    let delta = qty;
    if (type === 'STOCK_OUT' || type === 'RETURN_OUT') delta = -qty;
    if (type === 'ADJUSTMENT') delta = qty;

    const newBalance = Number(product.currentStock) + delta;

    await this.prisma.product.update({
      where: { id: product.id },
      data: { currentStock: newBalance },
    });

    return this.prisma.stockMovement.create({
      data: {
        productId: body.productId,
        type: type as any,
        quantity: qty,
        balanceAfter: newBalance,
        reference: body.reference || null,
        notes: body.notes || null,
      },
      include: { product: { select: { id: true, name: true, sku: true, unit: true } } },
    });
  }
}
