import { Controller, Inject, Get } from '@midwayjs/core';
import { Context } from '@midwayjs/koa';
import { RedisService } from '@midwayjs/redis';
// import { getAccessToken, getJsApiTicket, getSignature } from '../utils/wechat';

@Controller('/api')
export class AdminerController {
  @Inject()
  ctx: Context;

  @Inject()
  redisService: RedisService;

  @Get('/')
  async home(): Promise<string> {
    return 'Hello Midwayjs!';
  }
}
