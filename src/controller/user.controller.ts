import { Controller, Inject, Get, Param, Query } from '@midwayjs/core';
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
}
