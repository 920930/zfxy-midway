import { IMiddleware } from '@midwayjs/core';
import { Middleware } from '@midwayjs/decorator';
import { NextFunction, Context } from '@midwayjs/koa';

@Middleware()
export class ReportMiddleware implements IMiddleware<Context, NextFunction> {
  resolve() {
    return async (ctx: Context, next: NextFunction) => {
      const result = await next();
      if (ctx.path.includes('/api/excel')) {
        return result
      }
      return {
        code: 200,
        msg: 'OK',
        data: result,
      }
    };
  }

  static getName(): string {
    return 'report';
  }
}
