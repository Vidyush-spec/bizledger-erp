import {
  Controller, Get, Post, Delete,
  Body, Param, UseGuards, Request, HttpCode,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JournalEntriesService } from './journal-entries.service';

@Controller('journal-entries')
@UseGuards(AuthGuard('jwt'))
export class JournalEntriesController {
  constructor(private journalEntriesService: JournalEntriesService) {}

  @Get()
  findAll(@Request() req) {
    return this.journalEntriesService.findAll(req.user.companyId);
  }

  @Get('account-balances')
  getAccountBalances(@Request() req) {
    return this.journalEntriesService.getAccountBalances(req.user.companyId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.journalEntriesService.findOne(id, req.user.companyId);
  }

  @Post()
  create(@Body() body: any, @Request() req) {
    return this.journalEntriesService.create(body, req.user.sub, req.user.companyId);
  }

  @Delete(':id')
  @HttpCode(204)
  delete(@Param('id') id: string, @Request() req) {
    return this.journalEntriesService.delete(id, req.user.companyId);
  }
}