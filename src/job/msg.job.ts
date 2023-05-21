import { Job, IJob } from '@midwayjs/cron';
import { FORMAT, Inject, App } from '@midwayjs/core';
import { Application } from '@midwayjs/koa';
import { MsgService } from '../service/msg.service';
import { RedisService } from '@midwayjs/redis';
import type { TRedisToken, TSendMemberNote } from '../interface';
import { getJsApiTicket, getAccessToken } from '../utils/wechat';
import * as dayjs from 'dayjs';

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
    // 查看已发送员工新增客户信息
    const sendMember = await this.redisService.get('zfxy-send-member');
    const sendMembers: TSendMemberNote[] = JSON.parse(sendMember || '[]');
    // 查看已发送员工新增记录信息
    const sendNote = await this.redisService.get('zfxy-send-note');
    const sendNotes: TSendMemberNote[] = JSON.parse(sendNote || '[]');
    // menberUsers  menberNotes  admins
    const data = await this.msgService.index();
    // 找出没有发送 - 提示消息的员工
    const members = data.menberUsers.filter(item => {
      const index = sendMembers.find(mem => mem.openid === item.openid)
      if (index) {
        return dayjs(index.sendTime).isBefore(Date.now())
      } else {
        return true;
      }
    })
    // 找出没有发送 - 记录信息的员工
    const notes = data.menberNotes.filter(item => {
      const index = sendNotes.find(mem => mem.openid === item.openid)
      if (index) {
        return dayjs(index.sendTime).isBefore(Date.now())
      } else {
        return true;
      }
    })
    // 重新设定已发送消息的员工member
    const redisMember: TSendMemberNote[] = data.menberUsers.map(item => {
      const one = sendMembers.find(mem => mem.openid === item.openid)
      if (one) {
        return dayjs(one.sendTime).isBefore(Date.now()) ? one : { ...one, sendTime: one.sendTime + 1000 * 60 * 60 * 24 * 2 }
      } else {
        return { id: item.id, openid: item.openid, sendTime: Date.now() + 1000 * 60 * 60 * 24 * 2 }
      }
    })
    redisMember.length && this.redisService.set('zfxy-send-member', JSON.stringify(redisMember))
    // 重新设定已发送消息的员工member
    const redisNote: TSendMemberNote[] = data.menberNotes.map(item => {
      const one = sendNotes.find(mem => mem.openid === item.openid)
      if (one) {
        return dayjs(one.sendTime).isBefore(Date.now()) ? one : { ...one, sendTime: one.sendTime + 1000 * 60 * 60 * 24 * 2 }
      } else {
        return { id: item.id, openid: item.openid, sendTime: Date.now() + 1000 * 60 * 60 * 24 * 2 }
      }
    })
    redisNote.length && this.redisService.set('zfxy-send-note', JSON.stringify(redisNote))
    // 重新设定已发送消息的员工note
    // 给员工发送消息
    members.forEach(item =>
      this.msgService.message(
        token.access,
        item.openid,
        '未新增客户',
        `${item.name}：您超过7天未新增客户啦`
      )
    );
    notes.forEach(item =>
      this.msgService.message(
        token.access,
        item.openid,
        '未追踪客户',
        `${item.name}：您超过3天未追踪客户啦`
      )
    );
    // 给管理员发消息
    if (members.length) {
      data.admins.forEach(ad =>
        this.msgService.message(
          token.access,
          ad.openid,
          '未新增客户',
          `有${data.menberUsers.length}人7天未新增客户`
        )
      );
    }
    if (notes.length) {
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
