import { Inject, Controller, Post, Body, App, Get } from '@midwayjs/core';
import { Context, Application } from '@midwayjs/koa';
import { RedisService } from '@midwayjs/redis';
import { getJsApiTicket, getSignature, getAccessToken } from '../utils/wechat';
import type { TRedisToken } from '../interface';
import { User } from '../entity/user';
import { Note } from '../entity/note';
import { Op } from 'sequelize';
import { Adminer } from '../entity/adminer';
import { Trade } from '../entity/trade';

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
    let tokens = await this.redisService.get('zfxy-token')
    if (!tokens) {
      const AccessToken = await getAccessToken(this.app.getConfig('wechat.appid'), this.app.getConfig('wechat.secret'));
      const data = await getJsApiTicket(AccessToken.access_token)
      this.redisService.set('zfxy-token', JSON.stringify({ access: AccessToken.access_token, ticket: data.ticket }), 'EX', AccessToken.expires_in)
      return getSignature(this.ctx.req.headers.origin + url, data.ticket)
    }
    const token: TRedisToken = JSON.parse(tokens);
    return getSignature(this.ctx.req.headers.origin + url, token.ticket)
  }

  // 首页内容
  @Get('/index')
  async index() {
    const time = new Date().toLocaleDateString();
    const startTime = new Date(time).getTime();
    const endTime = new Date(time).getTime() + (24 * 60 * 60 * 1000 - 1);
    const usersNew = await User.findAndCountAll({
      where: {
        createdAt: {
          [Op.between]: [startTime, endTime],
        }
      },
      limit: 5,
      order: [['createdAt', 'DESC']],
      include: [
        { model: Adminer, attributes: ['id', 'name'] },
        { model: Trade }
      ],
    });
    const usersOld = await User.findAndCountAll({
      where: {
        createdAt: {
          [Op.lt]: startTime,
        }
      },
      limit: 5,
      order: [['createdAt', 'DESC']],
      include: [
        { model: Adminer, attributes: ['id', 'name'] },
        { model: Trade }
      ]
    });
    const noteNew = await Note.findAndCountAll({
      where: {
        createdAt: {
          [Op.between]: [startTime, endTime],
        }
      },
      limit: 5,
      order: [['createdAt', 'DESC']],
      include: [
        { model: Adminer, attributes: ['id', 'name'] },
        { model: User }
      ]
    });
    const noteOld = await Note.findAndCountAll({
      where: {
        createdAt: {
          [Op.lt]: startTime,
        }
      },
      limit: 5,
      order: [['createdAt', 'DESC']],
      include: [
        { model: Adminer, attributes: ['id', 'name'] },
        { model: User }
      ]
    });
    return {
      users: {
        today: usersNew.rows,
        todayCount: usersNew.count,
        old: usersOld.rows,
        oldCount: usersOld.count,
      },
      notes: {
        today: noteNew.rows,
        todayCount: noteNew.count,
        old: noteOld.rows,
        oldCount: noteOld.count,
      }
    }
  }
}
