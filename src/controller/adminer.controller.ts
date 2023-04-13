import { Controller, Inject, Get, Param, Query } from '@midwayjs/core';
import { Context } from '@midwayjs/koa';
import { AdminerService } from '../service/adminer.service';
import { ISearch } from '../interface';

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
    console.log(id)
    return this.adminerService.show(id);
  }
}
