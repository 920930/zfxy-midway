import { App, Provide, Inject } from '@midwayjs/core';
import { IMessage, TRedisToken } from '../interface';
import { RedisService } from '@midwayjs/redis';
import { Application } from '@midwayjs/koa';
import { sendMessage } from '../utils/wechat';
import { Adminer } from '../entity/adminer';
import { User } from '../entity/user';
import { Op } from 'sequelize';
import * as dayjs from 'dayjs';
import { Note } from '../entity/note';

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
      include: [
        { model: User, attributes: ['id', 'createdAt'], limit: 1, order: [['createdAt', 'DESC']] },
        { model: Note, attributes: ['id', 'createdAt'], limit: 1, order: [['createdAt', 'DESC']] },
      ],
    });
    // 员工列表
    const members = adminers.filter(item => item.roleId == 3);
    // 管理员列表
    const admins = adminers.filter(item => item.roleId != 3);
    // 逾期未新增用户的员工
    const menberUsers = members.filter(item => item.users.length && dayjs(item.users[0].createdAt).add(7, 'day').isBefore(dayjs()));
    // 逾期未追踪用户的员工
    const menberNotes = members.filter(item => item.notes.length && dayjs(item.notes[0].createdAt).add(3, 'day').isBefore(dayjs()));

    return {
      menberUsers,
      menberNotes,
      admins: admins.map(ad => ({ openid: ad.openid })),
    };
  }

  async message(access: string, openid: string, msg1: string, msg2: string) {
    const datas: IMessage = {
      url: this.app.getConfig('koa.web') + '/index',
      keyword1: {
        value: msg1,
      },
      keyword2: {
        value: msg2,
      },
    };
    console.log(datas)
    sendMessage(
      {
        access_token: access,
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
