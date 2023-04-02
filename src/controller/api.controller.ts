import { Inject, Controller, Post, Body, App } from '@midwayjs/core';
import { Context, Application } from '@midwayjs/koa';
import { RedisService } from '@midwayjs/redis';
import { getJsApiTicket, getSignature, getAccessToken } from '../utils/wechat';
import type { TRedisToken } from '../interface';

@Controller('/api')
export class APIController {
  @App()
  app: Application;

  @Inject()
  ctx: Context;

  @Inject()
  redisService: RedisService;

  @Post('/init')
  async init(@Body('url') url: string) {
    let ticket = await this.redisService.get('zfxy-token')
    if(!ticket) {
      const AccessToken = await getAccessToken(this.app.getConfig('wechat.appid'), this.app.getConfig('wechat.secret'));
      const data = await getJsApiTicket(AccessToken.access_token)
      this.redisService.set('zfxy-token', JSON.stringify({access: AccessToken.access_token, ticket}), 'EX', AccessToken.expires_in)
      return getSignature(this.ctx.req.headers.origin + url, data.ticket)
    }
    const token: TRedisToken = JSON.parse(ticket);
    return getSignature(this.ctx.req.headers.origin + url, token.ticket)
  }
}
