import { Inject, Controller, Post, Body } from '@midwayjs/core';
import { Context } from '@midwayjs/koa';
import { RedisService } from '@midwayjs/redis';
import { getAccessToken, getJsApiTicket, getSignature } from '../utils/wechat';

@Controller('/api')
export class APIController {
  @Inject()
  ctx: Context;

  @Inject()
  redisService: RedisService;

  @Post('/init')
  async init(@Body('url') url: string) {
    let ticket = await this.redisService.get('zfxy-ticket')
    if(!ticket) {
      const AccessToken = await getAccessToken();
      const data = await getJsApiTicket(AccessToken.access_token)
      if(data.errcode === 0) {
        ticket = data.ticket;
        this.redisService.set('zfxy-access', AccessToken.access_token, 'EX', AccessToken.expires_in)
        this.redisService.set('zfxy-ticket', data.ticket, 'EX', data.expires_in)
      }
    }
    // const info = await this.redisService.get('zfxy-adminer-' + this.ctx.adminer.id);
    // sendMessage()
    return getSignature(this.ctx.req.headers.origin + url, ticket)
  }
}
