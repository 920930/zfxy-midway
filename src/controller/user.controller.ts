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
    const adminer = this.ctx.adminer;
    // 员工创建，adminerId为自己
    if (adminer.roleId == 3) data.adminerId = this.ctx.adminer.id;
    else data.adminerId = Number.parseInt(data.adminerId.split('-')[0])
    data.tradeId = Number.parseInt(data.tradeId.split('-')[0])
    return this.userService.store(data)
  }

  @Put('/:id')
  async edit(@Body() data: any, @Param('id') id: string) {
    const adminer = this.ctx.adminer;
    data.adminerId = Number.parseInt(data.adminerId.split('-')[0])
    // 如果是员工 & 更新的客户信息adminerId 不是当前员工的id
    if (adminer.roleId == 3 && data.adminerId != adminer.id) {
      throw new CustomHttpError('您无权修改')
    }
    data['tradeId'] = data.tradeId.split('-')[0]
    return this.userService.edit(Number.parseInt(id), data)
  }

  @Del('/:id')
  async del(@Param('id') id: number) {
    console.log(id)
  }
}
