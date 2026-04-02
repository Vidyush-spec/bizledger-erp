import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PayrollService } from './payroll.service';

@Controller('payroll')
@UseGuards(AuthGuard('jwt'))
export class PayrollController {
  constructor(private service: PayrollService) {}

  @Get('runs')
  getRuns(@Request() req: any) {
    return this.service.getRuns(req.user.companyId);
  }

  @Post('process')
  process(@Request() req: any, @Body() body: any) {
    return this.service.processPayroll(req.user.companyId, Number(body.month), Number(body.year), body.paymentDate);
  }
}
