import { App, Provide, Inject } from '@midwayjs/core';
import { IAuthLogin } from '../interface';
import { Adminer } from '../entity/adminer';
import { CustomHttpError } from '../error/custom.error';
import { RedisService } from '@midwayjs/redis';
import { JwtService } from '@midwayjs/jwt';
import { Application } from '@midwayjs/koa';
import { getWechatUserAccessToken, getWechatUserInfo } from '../utils/wechat';

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

    if(!adminer.openid) {
      // 通过code调用获取用户openid
      const data = await getWechatUserAccessToken(info.code, this.app.getConfig('wechat.appid'), this.app.getConfig('wechat.secret'));
      const user = await getWechatUserInfo(data.access_token, data.openid);
      adminer.openid = data.openid;
      adminer.avatar = user.headimgurl;
      adminer.save();
      // 这里设置的时间为：中间件判断redis用户是否存在，如果不存在就表示refresh-token失效，'EX' 单位秒
      this.redisService.set(`zfxy-adminer-${adminer.id}`, JSON.stringify({id: adminer.id, openid: data.openid}), 'EX', this.app.getConfig('redis.client.end'));
      this.redisService.set(`zfxy-adminer-${adminer.id}-access_token`, data.access_token, 'EX', data.expires_in);
    } else {
      // 这里设置的时间为：中间件判断redis用户是否存在，如果不存在就表示refresh-token失效，'EX' 单位秒
      this.redisService.set(`zfxy-adminer-${adminer.id}`, JSON.stringify({id: adminer.id, openid: adminer.openid}), 'EX', this.app.getConfig('redis.client.end'));
      this.redisService.get(`zfxy-adminer-${adminer.id}-access_token`).then(async ret => {
        if(!ret) {
          const data = await getWechatUserAccessToken(info.code, this.app.getConfig('wechat.appid'), this.app.getConfig('wechat.secret'));
          this.redisService.set(`zfxy-adminer-${adminer.id}-access_token`, data.access_token, 'EX', data.expires_in);
        }
      })
    }
    const token = this.jwtService.signSync({id: adminer.id});
    return {
      token: `Bearer ${token}`,
    };
  }
}
