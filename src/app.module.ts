import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { InvoicesModule } from './invoices/invoices.module';
import { EmployeesModule } from './employees/employees.module';
import { ProductsModule } from './products/products.module';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    InvoicesModule,
    EmployeesModule,
    ProductsModule,
  ],
  providers: [PrismaService],
})
export class AppModule {}
