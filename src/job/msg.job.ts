import { Job, IJob } from '@midwayjs/cron';
import { FORMAT, Inject, App } from '@midwayjs/core';
import { Application } from '@midwayjs/koa';
import { MsgService } from '../service/msg.service';
import { RedisService } from '@midwayjs/redis';
import type { TRedisToken } from '../interface';
import { getJsApiTicket, getAccessToken } from '../utils/wechat';

@Job({
  // cronTime: FORMAT.CRONTAB.EVERY_HOUR,
  cronTime: FORMAT.CRONTAB.EVERY_PER_5_SECOND,
  start: true,
})
export class DataSyncCheckerJob implements IJob {
  @App()
  app: Application;

  @Inject()
  msgService: MsgService;

  @Inject()
  redisService: RedisService;

  async onTick() {
    let tokens = await this.redisService.get('zfxy-token');
    if (!tokens) {
      const AccessToken = await getAccessToken(this.app.getConfig('wechat.appid'), this.app.getConfig('wechat.secret'));
      const data = await getJsApiTicket(AccessToken.access_token)
      tokens = JSON.stringify({ access: AccessToken.access_token, ticket: data.ticket })
      this.redisService.set('zfxy-token', tokens, 'EX', AccessToken.expires_in)
    }
    const token: TRedisToken = JSON.parse(tokens);
    // menberUsers  menberNotes  admins
    const data = await this.msgService.index();
    // 给员工发送消息
    data.menberUsers.forEach(item =>
      this.msgService.message(
        token.access,
        item.openid,
        '未新增客户',
        `${item.name}：您超过7天未新增客户啦`
      )
    );
    data.menberNotes.forEach(item =>
      this.msgService.message(
        token.access,
        item.openid,
        '未追踪客户',
        `${item.name}：您超过3天未追踪客户啦`
      )
    );
    // 给管理员发消息
    if (data.menberUsers.length) {
      data.admins.forEach(ad =>
        this.msgService.message(
          token.access,
          ad.openid,
          '未新增客户',
          `有${data.menberUsers.length}人7天未新增客户`
        )
      );
    }
    if (data.menberNotes.length) {
      data.admins.forEach(ad =>
        this.msgService.message(
          token.access,
          ad.openid,
          '未追踪客户',
          `有${data.menberUsers.length}人3天未追踪客户`
        )
      );
    }
  }
}
