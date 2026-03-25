import { Controller, Get, Post, Put, Body, Param, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(AuthGuard('jwt'))
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  findAll(@Request() req) {
    return this.usersService.findAll(req.user.companyId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.usersService.findOne(id, req.user.companyId);
  }

  @Post()
  create(@Body() body: any, @Request() req) {
    return this.usersService.create(body, req.user.companyId);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: any, @Request() req) {
    return this.usersService.update(id, body, req.user.companyId);
  }
}