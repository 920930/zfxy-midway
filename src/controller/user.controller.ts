import { Controller, Inject, Get, Param, Query, Post, Put, Body } from '@midwayjs/core';
import { Context } from '@midwayjs/koa';
import { UserService } from '../service/user.service';
import { ISearch } from '../interface';

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
    return this.userService.store(this.ctx.adminer.id, data)
  }

  @Put('/:id/edit')
  async edit(@Body() data: any, @Param('id') uid: string) {
    return this.userService.edit(this.ctx.adminer.id, Number.parseInt(uid), data)
  }
}
