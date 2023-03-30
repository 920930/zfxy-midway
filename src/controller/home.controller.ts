import { Controller, Inject, Get, Post, Body } from '@midwayjs/core';
import { RedisService } from '@midwayjs/redis';
import { getAccessToken, getJsApiTicket, getSignature } from '../utils/wechat';

@Controller('/')
export class HomeController {
  @Inject()
  redisService: RedisService;

  @Get('/')
  async home(): Promise<string> {
    return 'Hello Midwayjs!';
  }

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
    return getSignature(url, ticket)
  }
}
