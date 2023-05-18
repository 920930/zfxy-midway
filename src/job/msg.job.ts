import { Job, IJob } from '@midwayjs/cron';
import { FORMAT, Inject } from '@midwayjs/core';
import { MsgService } from '../service/msg.service';

@Job({
  // cronTime: FORMAT.CRONTAB.EVERY_HOUR,
  cronTime: FORMAT.CRONTAB.EVERY_PER_5_SECOND,
  start: true,
})
export class DataSyncCheckerJob implements IJob {
  @Inject()
  msgService: MsgService;

  async onTick() {
    // menberUsers  menberNotes  admins
    const data = await this.msgService.index();
    console.log(data);
    // 给员工发送消息
    data.menberUsers.forEach(item =>
      this.msgService.message(
        item.openid,
        '未新增客户',
        `${item.name}：您超过7天未新增客户啦`
      )
    );
    data.menberNotes.forEach(item =>
      this.msgService.message(
        item.openid,
        '未追踪客户',
        `${item.name}：您超过3天未追踪客户啦`
      )
    );
    // 给管理员发消息
    if (data.menberUsers.length) {
      data.admins.forEach(ad =>
        this.msgService.message(
          ad.openid,
          '未新增客户',
          `有${data.menberUsers.length}人7天未新增客户`
        )
      );
    }
    if (data.menberNotes.length) {
      data.admins.forEach(ad =>
        this.msgService.message(
          ad.openid,
          '未追踪客户',
          `有${data.menberUsers.length}人3天未追踪客户`
        )
      );
    }
  }
}
