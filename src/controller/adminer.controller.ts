import { Controller, Inject, Get } from '@midwayjs/core';
import { Context } from '@midwayjs/koa';
import { AdminerService } from '../service/adminer.service';

@Controller('/api/adminer')
export class AdminerController {
  @Inject()
  ctx: Context;

  @Inject()
  adminerService: AdminerService;

  @Get('/me')
  async me() {
    return this.adminerService.me(this.ctx.adminer.id);
  }
}
