import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { InvoicesModule } from './invoices/invoices.module';
import { EmployeesModule } from './employees/employees.module';
import { ProductsModule } from './products/products.module';
import { JournalEntriesModule } from './journal-entries/journal-entries.module';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    InvoicesModule,
    EmployeesModule,
    ProductsModule,
    JournalEntriesModule,
  ],
  providers: [PrismaService],
})
export class AppModule {}