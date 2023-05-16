import { App, Provide, Inject } from '@midwayjs/core';
import { IAuthLogin, IMessage, TRedisToken } from '../interface';
import { Adminer } from '../entity/adminer';
import { CustomHttpError } from '../error/custom.error';
import { RedisService } from '@midwayjs/redis';
import { JwtService } from '@midwayjs/jwt';
import { Application } from '@midwayjs/koa';
import { getWechatUserAccessToken, getWechatUserInfo, sendMessage } from '../utils/wechat';
import { md5 } from '../utils';
import { User } from '../entity/user';
import { Op } from 'sequelize';
import * as dayjs from 'dayjs'

@Provide()
export class AuthService {

  @Inject()
  redisService: RedisService;

  @Inject()
  jwtService: JwtService;

  @App()
  app: Application;

  // 账户密码登录
  async login(info: IAuthLogin) {
    const adminer = await Adminer.findOne({
      where: {
        phone: info.phone,
        state: 1
      }
    })
    if (!adminer) throw new CustomHttpError('此账户不存在或禁用')
    if (md5(info.password) != adminer.password) throw new CustomHttpError('账户密码错误')
    const now = Date.now();
    // 通过code调用获取用户openid
    if (!adminer.openid) {
      try {
        const ret = await getWechatUserAccessToken(info.code, this.app.getConfig('wechat.appid'), this.app.getConfig('wechat.secret'));
        // 代表refre-token，过期需要重新登录
        this.redisService.set(`zfxy-adminer-${adminer.id}`, JSON.stringify({ id: adminer.id, openid: ret.openid, roleId: adminer.roleId, state: adminer.state, now }), 'EX', this.app.getConfig('redis.client.end'));
        const user = await getWechatUserInfo(ret.access_token, ret.openid);
        adminer.openid = ret.openid;
        !adminer.avatar && (adminer.avatar = user.headimgurl);
        adminer.save();
      } catch (err) {
        throw new CustomHttpError(err.errmsg)
      }
    } else {
      // 代表refre-token，过期需要重新登录
      this.redisService.set(`zfxy-adminer-${adminer.id}`, JSON.stringify({ id: adminer.id, openid: adminer.openid, roleId: adminer.roleId, state: adminer.state, now }), 'EX', this.app.getConfig('redis.client.end'));
    }

    const token = this.jwtService.signSync({ id: adminer.id, now });
    return {
      token: `Bearer ${token}`,
    };
  }

  // 微信登录
  async wechat(code: string) {
    try {
      const ret = await getWechatUserAccessToken(code, this.app.getConfig('wechat.appid'), this.app.getConfig('wechat.secret'));
      // 数据库查询openid
      const adminer = await Adminer.findOne({
        where: {
          openid: ret.openid,
          state: 1
        }
      })
      // 第一次登录，数据库只有手机号，没有openid
      if (!adminer) throw new CustomHttpError('第一次登录请使用账户密码登录')
      const now = Date.now();
      // 代表refre-token，过期需要重新登录
      this.redisService.set(`zfxy-adminer-${adminer.id}`, JSON.stringify({ id: adminer.id, openid: ret.openid, roleId: adminer.roleId, state: adminer.state, now }), 'EX', this.app.getConfig('redis.client.end'));
      const token = this.jwtService.signSync({ id: adminer.id, now });
      return {
        token: `Bearer ${token}`,
      };
    } catch (err) {
      throw new CustomHttpError(err.errmsg)
    }
  }

  logout(id: number) {
    this.redisService.del(`zfxy-adminer-${id}`)
  }

  // sendMessage
  async send(info: { userId: number; adminerId: number; content: string }) {
    const adminers = await Adminer.findAll({ where: { state: true, roleId: { [Op.in]: [1, 2] } }, attributes: ['id', 'name', 'openid'] })
    const formAd = await Adminer.findByPk(info.adminerId)
    const tokens = await this.redisService.get('zfxy-token')
    const token: TRedisToken = JSON.parse(tokens)
    const user = await User.findByPk(info.userId)
    const datas: IMessage = {
      url: this.app.getConfig('koa.web') + "/user/" + info.userId,
      keyword1: {
        value: user.name
      },
      keyword2: {
        value: user.phone
      },
      keyword3: {
        value: `${formAd.name}：${info.content}`
      }
    }
    adminers.forEach(item => sendMessage({ access_token: token.access, openid: item.openid, templateId: this.app.getConfig('wechat.templateId1') }, datas))
  }

  // moveMessage
  async move(user: { id: number, name: string, phone: string }, fromAdminId: number, toAdminId: number, superAdminId: number) {
    const adminers = await Adminer.findAll({ where: { state: true, roleId: { [Op.in]: [1, 2] } }, attributes: ['id', 'name', 'openid'] })
    const superAdmin = adminers.find(item => item.id === superAdminId)
    const toAdmin = await Adminer.findByPk(toAdminId)
    const fromAdmin = await Adminer.findByPk(fromAdminId)

    const tokens = await this.redisService.get('zfxy-token')
    const token: TRedisToken = JSON.parse(tokens)
    const datas: IMessage = {
      url: this.app.getConfig('koa.web') + "/user/" + user.id,
      first: {
        value: `管理员${superAdmin.name}，重新分配了客户`
      },
      keyword1: {
        value: `${user.name} - ${user.phone}`
      },
      keyword2: {
        value: `${superAdmin.name}将TA从${fromAdmin.name}转到${toAdmin.name}名下`
      },
      keyword3: {
        value: `${dayjs().format('YYYY-MM-DD HH:mm')}`
      }
    }
    adminers.forEach(item => sendMessage({ access_token: token.access, openid: item.openid, templateId: this.app.getConfig('wechat.templateId2') }, datas))
    sendMessage({ access_token: token.access, openid: fromAdmin.openid, templateId: this.app.getConfig('wechat.templateId2') }, datas)
    sendMessage({ access_token: token.access, openid: toAdmin.openid, templateId: this.app.getConfig('wechat.templateId2') }, datas)
  }
}
