import { Controller, Inject, Get, Param, Post, Put, Body, Del, Query } from '@midwayjs/core';
import { Context } from '@midwayjs/koa';
import { Market } from '../entity/market';
import { CustomHttpError } from '../error/custom.error';

@Controller('/api/market')
export class MarketController {
  @Inject()
  ctx: Context;

  @Get('/')
  async index(@Query('state') state: any) {
    const where: { [key: string]: any } = {}
    !state && (where['state'] = true)
    return Market.findAll({ where })
  }

  @Put('/:id')
  async edit(@Param('id') id: number, @Body() b: any) {
    const me = this.ctx.adminer
    if (me.roleId == 3) throw new CustomHttpError('您无权限')
    await Market.update(b, { where: { id } })
    return id
  }

  @Post('/store')
  async store(@Body() b: any) {
    const me = this.ctx.adminer
    if (me.roleId == 3) throw new CustomHttpError('您无权限')
    await Market.create(b)
    return 'ok'
  }

  @Del('/:id')
  destroy(@Param('id') id: number) {
    const me = this.ctx.adminer
    if (me.roleId == 3) throw new CustomHttpError('您无权限')
    Market.destroy({ where: { id } })
  }
}