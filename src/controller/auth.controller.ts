import { Inject, Controller, Get, Post, Body, Query } from '@midwayjs/core';
import { Context } from '@midwayjs/koa';
import { AuthService } from '../service/auth.service';
import { IAuthLogin } from '../interface';

@Controller('/api')
export class AuthController {
  @Inject()
  ctx: Context;

  @Inject()
  authService: AuthService;

  @Post('/login')
  async login(@Body() info: IAuthLogin) {
    return this.authService.login(info)
  }

  @Get('/wechat')
  async wechat(@Query('code') code: string){
    return this.authService.wechat(code)
  }
}
