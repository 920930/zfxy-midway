import { Inject, Controller, Post, Body } from '@midwayjs/core';
import { Context } from '@midwayjs/koa';
import { AuthService } from '../service/auth.service';
import { IAuthLogin } from '../interface';

@Controller('/api')
export class APIController {
  @Inject()
  ctx: Context;

  @Inject()
  authService: AuthService;

  @Post('/login')
  async login(@Body() info: IAuthLogin) {
    return this.authService.login(info)
  }
}
