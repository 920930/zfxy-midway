import { Controller, Inject, Get, Param, Post, Put, Body, Del, Query } from '@midwayjs/core';
import { Context } from '@midwayjs/koa';
import { Trade } from '../entity/trade';
import { CustomHttpError } from '../error/custom.error';

@Controller('/api/trade')
export class TradeController {
  @Inject()
  ctx: Context;

  @Get('/')
  async index(@Query('state') state: any) {
    const where: { [key: string]: any } = {}
    !state && (where['state'] = true)
    return Trade.findAll({ where })
  }

  @Put('/:id')
  async edit(@Param('id') id: number, @Body() b: any) {
    const me = this.ctx.adminer
    if (me.roleId == 3) throw new CustomHttpError('您无权限')
    await Trade.update(b, { where: { id } })
    return id
  }

  @Post('/store')
  async store(@Body() b: any) {
    const me = this.ctx.adminer
    if (me.roleId == 3) throw new CustomHttpError('您无权限')
    await Trade.create(b)
    return 'ok'
  }

  @Del('/:id')
  destroy(@Param('id') id: number) {
    const me = this.ctx.adminer
    if (me.roleId == 3) throw new CustomHttpError('您无权限')
    Trade.destroy({ where: { id } })
  }
}