import { App, Provide, Inject } from '@midwayjs/core';
import { IAuthLogin } from '../interface';
import { Adminer } from '../entity/adminer';
import { CustomHttpError } from '../error/custom.error';
import { RedisService } from '@midwayjs/redis';
import { JwtService } from '@midwayjs/jwt';
import { Application } from '@midwayjs/koa';
import { getWechatUserAccessToken } from '../utils/wechat';
import { md5 } from '../utils';

@Provide()
export class AuthService {

  @Inject()
  redisService: RedisService;

  @Inject()
  jwtService: JwtService;

  @App()
  app: Application;

  async login(info: IAuthLogin) {
    const adminer = await Adminer.findOne({
      where: {
        phone: info.phone,
        state: 1
      }
    })
    if(!adminer) throw new CustomHttpError('此账户不存在或禁用')
    if(md5(info.password) != adminer.password) throw new CustomHttpError('账户密码错误')
    const now = Date.now();
    // 通过code调用获取用户openid
    if(!adminer.openid) {
      try {
        const ret = await getWechatUserAccessToken(info.code, this.app.getConfig('wechat.appid'), this.app.getConfig('wechat.secret'));
        // 代表refre-token，过期需要重新登录
        this.redisService.set(`zfxy-adminer-${adminer.id}`, JSON.stringify({id: adminer.id, openid: ret.openid, now}), 'EX', this.app.getConfig('redis.client.end'));
        // const user = await getWechatUserInfo(ret.access_token, ret.openid);
        adminer.openid = ret.openid;
        // !adminer.avatar && (adminer.avatar = user.headimgurl);
        adminer.save();
      } catch (err) {
        throw new CustomHttpError(err.errmsg)
      }
    } else {
      // 代表refre-token，过期需要重新登录
      this.redisService.set(`zfxy-adminer-${adminer.id}`, JSON.stringify({id: adminer.id, openid: adminer.openid, now}), 'EX', this.app.getConfig('redis.client.end'));
    }

    const token = this.jwtService.signSync({id: adminer.id, now});
    return {
      token: `Bearer ${token}`,
    };
  }
}
