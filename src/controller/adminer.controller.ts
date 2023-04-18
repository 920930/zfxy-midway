import { Controller, Inject, Get, Param, Query, Put, Body, Post } from '@midwayjs/core';
import { Context } from '@midwayjs/koa';
import { AdminerService } from '../service/adminer.service';
import { ISearch } from '../interface';
import { Adminer } from '../entity/adminer';

@Controller('/api/adminer')
export class AdminerController {
  @Inject()
  ctx: Context;

  @Inject()
  adminerService: AdminerService;

  @Get('/')
  async index(@Query() search: ISearch) {
    return this.adminerService.index(search);
  }

  @Get('/me')
  async me() {
    return this.adminerService.me(this.ctx.adminer.id);
  }

  @Get('/:id')
  async show(@Param('id') id: number) {
    return this.adminerService.show(id);
  }

  @Put('/:id/edit')
  async edit(@Body() data: any, @Param('id') id: string) {
    return this.adminerService.edit(this.ctx.adminer.id, id, data)
  }

  @Post('/store')
  async store(@Body() data: any) {
    return this.adminerService.store(this.ctx.adminer.id, data)
  }

  @Get('/all')
  async all() {
    return Adminer.findAll({
      where: { state: true },
      attributes: ['id', 'name']
    });
  }
}
