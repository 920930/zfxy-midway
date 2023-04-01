import { App, Inject, Middleware, httpError } from '@midwayjs/core';
import { Context, NextFunction } from '@midwayjs/koa';
import { JwtService } from '@midwayjs/jwt';
import { RedisService } from '@midwayjs/redis';
import { Application } from '@midwayjs/koa';

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
          if(typeof ret !== 'string') {
            console.log(ret.payload)
            const info = await this.redisService.get('zfxy-adminer-' + ret.payload['id']);
            console.log('info', info)
            if(!info) throw new httpError.UnauthorizedError();
            ctx.adminer = JSON.parse(info) as {id: string; openid: string};
          }
        } catch (error) {
          const ret = this.jwtService.decodeSync(token);
          const info = await this.redisService.get('zfxy-adminer-' + ret['id']);
          console.log('err info', info)
          // 如果redis中数据都不存在，就代表refre-token过期，需要重新登录
          if(!info) throw new httpError.UnauthorizedError();
          ctx.adminer = JSON.parse(info) as {id: string; openid: string};
          //token过期 生成新的token
          const newToken = this.jwtService.signSync({id: ret['id']})
          //将新token放入Authorization中返回给前端
          ctx.set('Access-Control-Expose-Headers', "Authorization")
          ctx.set('Authorization', `Bearer ${newToken}`)
        }
        await next();
      }
    };
  }

  // 配置忽略鉴权的路由地址
  public match(ctx: Context): boolean {
    return !ctx.path.includes('/api/login');
  }
}