import { App, Inject, Middleware, httpError } from '@midwayjs/core';
import { Context, NextFunction } from '@midwayjs/koa';
import { JwtService } from '@midwayjs/jwt';
import { RedisService } from '@midwayjs/redis';
import { Application } from '@midwayjs/koa';
import type { TRedisInfo } from '../interface';
// import { CustomHttpError } from '../error/custom.error';
import { getAccessToken, getJsApiTicket } from '../utils/wechat';

@Middleware()
export class AuthMiddleware {
  @Inject()
  jwtService: JwtService;

  @Inject()
  redisService: RedisService;

  @App()
  app: Application;

  public static getName(): string {
    return 'jwt';
  }

  resolve() {
    return async (ctx: Context, next: NextFunction) => {
      // 判断下有没有校验信息
      if (!ctx.headers['authorization']) {
        throw new httpError.UnauthorizedError();
      }

      // 从 header 上获取校验信息
      const parts = ctx.get('authorization').trim().split(' ');

      if (parts.length !== 2) {
        throw new httpError.UnauthorizedError();
      }

      const [scheme, token] = parts;

      if (/^Bearer$/i.test(scheme)) {
        try {
          //jwt.verify方法验证token是否有效
          const ret = this.jwtService.verifySync(token, { complete: true });
          if (typeof ret !== 'string') {
            const info = await this.redisService.get('zfxy-adminer-' + ret.payload['id']);
            // 如果redis中数据都不存在，就代表refre-token过期，需要重新登录
            if (!info) throw new httpError.UnauthorizedError();
            const adminer: TRedisInfo = JSON.parse(info);
            ctx.adminer = { id: adminer.id, roleId: adminer.roleId };
          }
        } catch (error) {
          const ret = this.jwtService.decodeSync(token);
          const info = await this.redisService.get('zfxy-adminer-' + ret['id']);
          // 如果redis中数据都不存在，就代表refre-token过期，需要重新登录
          if (!info) throw new httpError.UnauthorizedError();
          const adminer: TRedisInfo = JSON.parse(info);
          // if(adminer.now != ret['now']) throw new CustomHttpError('不是最后的Token');
          ctx.adminer = { id: adminer.id, roleId: adminer.roleId };
          // token过期 生成新的token
          const now = Date.now();
          adminer.now = now;
          this.redisService.set('zfxy-adminer-' + ret['id'], JSON.stringify(adminer), 'EX', this.app.getConfig('redis.client.end'));
          const newToken = this.jwtService.signSync({ id: adminer.id, now })
          // 将新token放入Authorization中返回给前端
          ctx.set('Access-Control-Expose-Headers', "Authorization")
          ctx.set('Authorization', `Bearer ${newToken}`)
          // 更新微信公众号全局token
          this.redisService.get('zfxy-token')
            .then(async ret => {
              if (ret) return ret;
              const AccessToken = await getAccessToken(this.app.getConfig('wechat.appid'), this.app.getConfig('wechat.secret'));
              const data = await getJsApiTicket(AccessToken.access_token)
              if (data.errcode === 0) {
                this.redisService.set('zfxy-token', JSON.stringify({ access: AccessToken.access_token, ticket: data.ticket }), 'EX', AccessToken.expires_in)
              }
            })
        }
        await next();
      }
    };
  }

  // 配置忽略鉴权的路由地址
  public match(ctx: Context): boolean {
    const routes = ['/api/login', '/api/wechat']
    return !routes.some(item => ctx.path.includes(item))
  }
}