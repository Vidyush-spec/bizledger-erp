import { Module } from '@nestjs/common';
import { JournalEntriesController } from './journal-entries.controller';
import { JournalEntriesService } from './journal-entries.service';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [JournalEntriesController],
  providers: [JournalEntriesService, PrismaService],
})
export class JournalEntriesModule {}