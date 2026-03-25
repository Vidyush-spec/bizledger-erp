import {
  Controller, Get, Post, Put, Delete,
  Body, Param, UseGuards, Request, HttpCode,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { EmployeesService } from './employees.service';

@Controller('employees')
@UseGuards(AuthGuard('jwt'))
export class EmployeesController {
  constructor(private employeesService: EmployeesService) {}

  @Get()
  findAll(@Request() req) {
    return this.employeesService.findAll(req.user.companyId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.employeesService.findOne(id, req.user.companyId);
  }

  @Post()
  create(@Body() body: any, @Request() req) {
    return this.employeesService.create(body, req.user.companyId);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: any, @Request() req) {
    return this.employeesService.update(id, body, req.user.companyId);
  }

  @Delete(':id')
  @HttpCode(204)
  delete(@Param('id') id: string, @Request() req) {
    return this.employeesService.delete(id, req.user.companyId);
  }
}