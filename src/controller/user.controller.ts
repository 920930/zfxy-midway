import { Controller, Inject, Get, Param, Query, Post, Put, Body, Del } from '@midwayjs/core';
import { Context } from '@midwayjs/koa';
import { UserService } from '../service/user.service';
import { ISearch } from '../interface';
import { CustomHttpError } from '../error/custom.error';

@Controller('/api/user')
export class UserController {
  @Inject()
  ctx: Context;

  @Inject()
  userService: UserService;

  @Get('/')
  async index(@Query() search: ISearch) {
    return this.userService.index(search);
  }

  @Get('/:id')
  async show(@Param('id') id: number) {
    return this.userService.show(id);
  }

  @Post('/store')
  async store(@Body() data: any) {
    const admin = this.ctx.adminer;
    data.adminerId = Number.parseInt(admin.id)
    data.tradeId = Number.parseInt(data.tradeId.split('-')[0])
    return this.userService.store(data)
  }

  @Put('/:id/move')
  async move(@Param('id') uid: string, @Body('aid') aid: string) {
    const adminer: { id: number, roleId: number } = this.ctx.adminer;
    const roleId = Number.parseInt(this.ctx.adminer.roleId);
    if (roleId == 3) {
      throw new CustomHttpError('您没有权限')
    }
    return this.userService.move(uid, aid, adminer.id)
  }

  @Put('/:id')
  async edit(@Body() data: any, @Param('id') id: string) {
    const adminer = this.ctx.adminer;
    data.adminerId && delete data['adminerId']
    // data.marketId = data.marketId.split('-')[0]
    data['tradeId'] = data.tradeId.split('-')[0]
    return this.userService.edit(Number.parseInt(id), data, adminer.id)
  }

  @Del('/:id')
  async del(@Param('id') id: number) {
    console.log(id)
  }

  @Get('/:id/excel')
  async oneExcel(@Param('id') id: number) {
    const adminer = this.ctx.adminer;
    if (adminer.roleId == 3) throw new CustomHttpError('您没有权限')
    return this.userService.oneExcel(id);
  }
}
