import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { StockMovementsService } from './stock-movements.service';

@Controller('stock-movements')
@UseGuards(AuthGuard('jwt'))
export class StockMovementsController {
  constructor(private service: StockMovementsService) {}

  @Get()
  findAll(@Request() req: any) {
    return this.service.findAll(req.user.companyId);
  }

  @Post()
  create(@Request() req: any, @Body() body: any) {
    return this.service.create(req.user.companyId, body);
  }
}
