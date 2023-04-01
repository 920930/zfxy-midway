import { Catch } from '@midwayjs/core';
import { Context } from '@midwayjs/koa';

@Catch()
export class DefaultErrorFilter {
  async catch(err: Error & { status: number }, ctx: Context) {
    // 所有的未分类错误会到这里
    ctx.status = err.status ?? 500;
    return {
      status: err.status ?? 500,
      message: err.message,
    };
  }
}
