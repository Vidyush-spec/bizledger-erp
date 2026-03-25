import {
  Controller, Get, Post, Put, Delete,
  Body, Param, Query, UseGuards, Request, HttpCode,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { InvoicesService } from './invoices.service';

@Controller('invoices')
@UseGuards(AuthGuard('jwt'))
export class InvoicesController {
  constructor(private invoicesService: InvoicesService) {}

  @Get()
  findAll(@Request() req, @Query('status') status?: string) {
    return this.invoicesService.findAll(req.user.companyId, status);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.invoicesService.findOne(id, req.user.companyId);
  }

  @Post()
  create(@Body() body: any, @Request() req) {
    return this.invoicesService.create(body, req.user.sub, req.user.companyId);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: any, @Request() req) {
    return this.invoicesService.update(id, body, req.user.companyId);
  }

  @Delete(':id')
  @HttpCode(204)
  delete(@Param('id') id: string, @Request() req) {
    return this.invoicesService.delete(id, req.user.companyId);
  }
}