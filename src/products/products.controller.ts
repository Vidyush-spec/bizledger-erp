import {
  Controller, Get, Post, Put, Delete,
  Body, Param, UseGuards, Request, HttpCode,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ProductsService } from './products.service';

@Controller('products')
@UseGuards(AuthGuard('jwt'))
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @Get()
  findAll(@Request() req) {
    return this.productsService.findAll(req.user.companyId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.productsService.findOne(id, req.user.companyId);
  }

  @Post()
  create(@Body() body: any, @Request() req) {
    return this.productsService.create(body, req.user.companyId);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: any, @Request() req) {
    return this.productsService.update(id, body, req.user.companyId);
  }

  @Delete(':id')
  @HttpCode(204)
  delete(@Param('id') id: string, @Request() req) {
    return this.productsService.delete(id, req.user.companyId);
  }
}