import { Controller, Inject, Get, Param, Post, Put, Body, Del } from '@midwayjs/core';
import { Context } from '@midwayjs/koa';
import { Trade } from '../entity/trade';

@Controller('/api/trade')
export class TradeController {
  @Inject()
  ctx: Context;

  @Get('/')
  index() {
    return Trade.findAll({
      where: { state: true }
    })
  }

  @Put('/:id/edit')
  edit(@Param() id: any) {
    console.log(id)
  }

  @Post('/store')
  store(@Body() b: any) { }

  @Del('/del')
  destroy() { }
}