import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class PayrollService {
  constructor(private prisma: PrismaService) {}

  async getRuns(companyId: string) {
    return this.prisma.payrollRun.findMany({
      where: { companyId },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
      include: { items: { include: { employee: { select: { name: true, employeeId: true, department: true, designation: true } } } } },
    });
  }

  async processPayroll(companyId: string, month: number, year: number, paymentDate?: string) {
    const existing = await this.prisma.payrollRun.findFirst({ where: { companyId, month, year } });
    if (existing) throw new BadRequestException('Payroll already processed for this month');

    const employees = await this.prisma.employee.findMany({ where: { companyId, isActive: true, deletedAt: null } });
    if (employees.length === 0) throw new BadRequestException('No active employees found');

    let totalGross = 0, totalNet = 0, totalPF = 0, totalESI = 0, totalPT = 0;

    const items = employees.map(emp => {
      const basic = emp.basicSalary;
      const hra = emp.hra;
      const da = emp.da;
      const other = emp.otherAllowances;
      const gross = basic + hra + da + other;
      const pfEmp = Math.round(basic * 0.12);
      const pfEmpR = Math.round(basic * 0.12);
      const esiEmp = gross <= 21000 ? Math.round(gross * 0.0075) : 0;
      const esiEmpR = gross <= 21000 ? Math.round(gross * 0.0325) : 0;
      const pt = basic <= 10000 ? 0 : basic <= 15000 ? 150 : 200;
      const net = gross - pfEmp - esiEmp - pt;
      totalGross += gross; totalNet += net;
      totalPF += pfEmp + pfEmpR; totalESI += esiEmp + esiEmpR; totalPT += pt;
      return { employeeId: emp.id, basicSalary: basic, hra, da, otherAllowances: other, grossSalary: gross, pfEmployee: pfEmp, pfEmployer: pfEmpR, esiEmployee: esiEmp, esiEmployer: esiEmpR, professionalTax: pt, tds: 0, netSalary: net };
    });

    return this.prisma.payrollRun.create({
      data: {
        companyId, month, year,
        paymentDate: paymentDate ? new Date(paymentDate) : null,
        status: 'PROCESSED',
        totalGross, totalNet, totalPF, totalESI, totalPT,
        processedAt: new Date(),
        items: { create: items },
      },
      include: { items: { include: { employee: { select: { name: true, employeeId: true, department: true, designation: true } } } } },
    });
  }
}
