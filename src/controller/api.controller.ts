import { Inject, Controller, Get, Query, Post, Body } from '@midwayjs/core';
import { Context } from '@midwayjs/koa';
import { UserService } from '../service/user.service';
import { RedisService } from '@midwayjs/redis';
import { getAccessToken, getJsApiTicket, getSignature } from '../utils/wechat';

@Controller('/api')
export class APIController {
  @Inject()
  ctx: Context;

  @Inject()
  redisService: RedisService;

  @Inject()
  userService: UserService;

  @Post('/init')
  async init(@Body('url') url: string) {
    console.log(this.ctx.req.headers.origin + url)
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
    return getSignature(this.ctx.req.headers.origin + url, ticket)
  }

  @Get('/get_user')
  async getUser(@Query('uid') uid) {
    const user = await this.userService.getUser({ uid });
    return { success: true, message: 'OK', data: user };
  }
}
