import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class JournalEntriesService {
  constructor(private prisma: PrismaService) {}

  async findAll(companyId: string) {
    return this.prisma.journalEntry.findMany({
      where: { companyId, deletedAt: null },
      include: { lines: true },
      orderBy: { date: 'desc' },
    });
  }

  async findOne(id: string, companyId: string) {
    const entry = await this.prisma.journalEntry.findFirst({
      where: { id, companyId, deletedAt: null },
      include: { lines: true },
    });
    if (!entry) throw new NotFoundException('Journal entry not found');
    return entry;
  }

  async create(data: any, userId: string, companyId: string) {
    const { lines, ...entryData } = data;
    return this.prisma.journalEntry.create({
      data: {
        ...entryData,
        companyId,
        createdBy: userId,
        date: new Date(entryData.date),
        status: 'POSTED',
        lines: {
          create: (lines || []).map((l: any) => ({
            debitAccountId: l.debitAccountId || null,
            creditAccountId: l.creditAccountId || null,
            amount: l.amount,
            description: l.description || '',
          })),
        },
      },
      include: { lines: true },
    });
  }

  async delete(id: string, companyId: string) {
    await this.findOne(id, companyId);
    return this.prisma.journalEntry.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async getAccountBalances(companyId: string) {
    const entries = await this.prisma.journalEntry.findMany({
      where: { companyId, deletedAt: null, status: 'POSTED' },
      include: { lines: true },
    });

    const balances: Record<string, number> = {};
    entries.forEach(entry => {
      entry.lines.forEach((line: any) => {
        if (line.debitAccountId) {
          balances[line.debitAccountId] = (balances[line.debitAccountId] || 0) + Number(line.amount);
        }
        if (line.creditAccountId) {
          balances[line.creditAccountId] = (balances[line.creditAccountId] || 0) - Number(line.amount);
        }
      });
    });
    return balances;
  }
}