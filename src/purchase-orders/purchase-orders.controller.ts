import { Controller, Get, Post, Patch, Body, Param, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PurchaseOrdersService } from './purchase-orders.service';

@Controller('purchase-orders')
@UseGuards(AuthGuard('jwt'))
export class PurchaseOrdersController {
  constructor(private service: PurchaseOrdersService) {}

  @Get()
  findAll(@Request() req: any) {
    return this.service.findAll(req.user.companyId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.service.findOne(id, req.user.companyId);
  }

  @Post()
  create(@Request() req: any, @Body() body: any) {
    return this.service.create(req.user.companyId, body);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Request() req: any, @Body() body: any) {
    return this.service.updateStatus(id, req.user.companyId, body.status);
  }
}
