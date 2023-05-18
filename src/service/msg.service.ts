import { App, Provide, Inject } from '@midwayjs/core';
import { IMessage, TRedisToken } from '../interface';
import { RedisService } from '@midwayjs/redis';
import { Application } from '@midwayjs/koa';
import { sendMessage } from '../utils/wechat';
import { Adminer } from '../entity/adminer';
import { User } from '../entity/user';
import { Op } from 'sequelize';
import * as dayjs from 'dayjs';

@Provide()
export class MsgService {
  @Inject()
  redisService: RedisService;

  @App()
  app: Application;

  async index() {
    const adminers = await Adminer.findAll({
      where: { state: true },
      attributes: ['id', 'name', 'openid', 'roleId'],
    });
    // 员工列表
    const members = adminers.filter(item => item.roleId == 3);
    // 管理员列表
    const admins = adminers.filter(item => item.roleId != 3);
    // 员工提交用户记录
    const userData = await this.redisService.get('zfxy-yuqi-user');
    const userList: { id: number; time: number }[] = JSON.parse(
      userData || '[]'
    );
    const memberUserList = members.map(item => {
      const info = {
        name: item.name,
        openid: item.openid,
        yuqi: true,
        time: Date.now(),
      };
      const one = userList.find(ret => ret.id == item.id);
      if (!one) return info;
      info.time = one.time;
      if (one.time < info.time) return info;
      info.yuqi = false;
      return info;
    });
    // 员工追踪用户记录
    const noteData = await this.redisService.get('zfxy-yuqi-note');
    const noteList: { id: number; time: number }[] = JSON.parse(
      noteData || '[]'
    );
    const memberNoteList = members.map(item => {
      const info = {
        name: item.name,
        openid: item.openid,
        yuqi: true,
        time: Date.now(),
      };
      const one = noteList.find(ret => ret.id == item.id);
      if (!one) return info;
      info.time = one.time;
      if (one.time < Date.now()) return info;
      info.yuqi = false;
      return info;
    });
    // 预期未新增用户的员工
    const menberUsers = memberUserList.filter(item => item.yuqi);
    // 逾期未追踪用户的员工
    const menberNotes = memberNoteList.filter(item => item.yuqi);

    return {
      menberUsers,
      menberNotes,
      admins: admins.map(ad => ({ openid: ad.openid })),
    };
  }

  async message(openid: string, msg1: string, msg2: string) {
    const tokens = await this.redisService.get('zfxy-token');
    const token: TRedisToken = JSON.parse(tokens);
    const datas: IMessage = {
      url: this.app.getConfig('koa.web') + '/index',
      keyword1: {
        value: msg1,
      },
      keyword2: {
        value: msg2,
      },
    };
    sendMessage(
      {
        access_token: token.access,
        openid,
        templateId: this.app.getConfig('wechat.templateId3'),
      },
      datas
    );
  }

  // sendMessage
  async send(info: { userId: number; adminerId: number; content: string }) {
    const adminers = await Adminer.findAll({
      where: { state: true, roleId: { [Op.in]: [1, 2] } },
      attributes: ['id', 'name', 'openid'],
    });
    const formAd = await Adminer.findByPk(info.adminerId);
    const tokens = await this.redisService.get('zfxy-token');
    const token: TRedisToken = JSON.parse(tokens);
    const user = await User.findByPk(info.userId);
    const datas: IMessage = {
      url: this.app.getConfig('koa.web') + '/user/' + info.userId,
      keyword1: {
        value: user.name,
      },
      keyword2: {
        value: user.phone,
      },
      keyword3: {
        value: `${formAd.name}：${info.content}`,
      },
    };
    adminers.forEach(item =>
      sendMessage(
        {
          access_token: token.access,
          openid: item.openid,
          templateId: this.app.getConfig('wechat.templateId1'),
        },
        datas
      )
    );
  }

  // moveMessage
  async move(
    user: { id: number; name: string; phone: string },
    fromAdminId: number,
    toAdminId: number,
    superAdminId: number
  ) {
    const adminers = await Adminer.findAll({
      where: { state: true, roleId: { [Op.in]: [1, 2] } },
      attributes: ['id', 'name', 'openid'],
    });
    const superAdmin = adminers.find(item => item.id === superAdminId);
    const toAdmin = await Adminer.findByPk(toAdminId);
    const fromAdmin = await Adminer.findByPk(fromAdminId);

    const tokens = await this.redisService.get('zfxy-token');
    const token: TRedisToken = JSON.parse(tokens);
    const datas: IMessage = {
      url: this.app.getConfig('koa.web') + '/user/' + user.id,
      first: {
        value: `管理员${superAdmin.name}，重新分配了客户`,
      },
      keyword1: {
        value: `${user.name} - ${user.phone}`,
      },
      keyword2: {
        value: `${superAdmin.name}将TA从${fromAdmin.name}转到${toAdmin.name}名下`,
      },
      keyword3: {
        value: `${dayjs().format('YYYY-MM-DD HH:mm')}`,
      },
    };
    adminers.forEach(item =>
      sendMessage(
        {
          access_token: token.access,
          openid: item.openid,
          templateId: this.app.getConfig('wechat.templateId2'),
        },
        datas
      )
    );
    // 通知 from员工
    sendMessage(
      {
        access_token: token.access,
        openid: fromAdmin.openid,
        templateId: this.app.getConfig('wechat.templateId2'),
      },
      datas
    );
    // 通知 to员工
    sendMessage(
      {
        access_token: token.access,
        openid: toAdmin.openid,
        templateId: this.app.getConfig('wechat.templateId2'),
      },
      datas
    );
  }
}
