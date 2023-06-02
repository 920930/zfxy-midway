import { Controller, Inject, Get, Param, Query } from '@midwayjs/core';
import { RedisService } from '@midwayjs/redis';
import { Context } from '@midwayjs/koa';
import xlsx from 'node-xlsx'
import { CustomHttpError } from '../error/custom.error';
import { User } from '../entity/user';
import { Adminer } from '../entity/adminer';
import { Note } from '../entity/note';
import { Market } from '../entity/market';
import { Trade } from '../entity/trade';

@Controller('/api/excel')
export class UserController {
  @Inject()
  ctx: Context;

  @Inject()
  redisService: RedisService;

  @Get('/:code')
  async oneUser(@Param('code') code: string, @Query('page') page: string) {
    const str = await this.redisService.get('zfxy-excel-' + code);
    const info: { id: string; type?: string } | null = JSON.parse(str);
    console.log(info)
    if (info == null) throw new CustomHttpError('已过期');
    return info.id != '0'
      ? this.noteFn(Number.parseInt(info.id), Number.parseInt(page))
      : this.userFn(Number.parseInt(page), info.type);
  }

  async userFn(page: number, type: string) {
    const adminer = type === 'all'
      ? null
      : await Adminer.findOne({ where: { id: type }, attributes: ['id', 'name', 'phone'] });

    const include = [
      { model: Market, attributes: ['name'] },
      { model: Trade, attributes: ['name'] }
    ];
    !adminer && include.push({ model: Adminer, attributes: ['name'] })
    const users = await User.findAndCountAll({
      attributes: ['name', 'phone', 'sex', 'address', 'area', 'timer', 'desc', 'createdAt'],
      limit: 1000,
      offset: 1000 * (page - 1),
      order: [['createdAt', 'DESC']],
      where: (type === 'all' ? {} : { adminerId: type }),
      include
    })
    this.ctx.set('Access-Control-Expose-Headers', "count")
    this.ctx.set('count', `${users.count}`);

    let data = users.rows.map((item, i) => [i + 1, item.name, item.sex ? '女' : '男', item.phone, item.markets.map(mar => mar.name).join('-'), item.address, item.trade.name, item.area, item.timer, item.desc, item.createdAt, adminer ? null : item.adminer.name]);
    data = [
      adminer ? [adminer.name, adminer.phone] : ['所有客户'],
      ['序号', '姓名', '性别', '电话', '意向市场', '客户地址', '主营行业', '意向租赁面积', '意向租赁时长', '简介', '创建日期', adminer ? null : '员工'],
      ...data
    ];
    const options = { '!cols': [{ wch: 5 }, { wch: 10 }, { wch: 5 }, { wch: 15 }, { wch: 25 }, { wch: 30 }, { wch: 10 }, { wch: 16 }, { wch: 16 }, { wch: 30 }, { wch: 16 }] };
    const excel = xlsx.build([{ name: `${adminer ? adminer.name : ''}客户列表`, data, options }]);
    return excel;
  }

  async noteFn(id: number, page: number) {
    const user = await User.findOne({
      where: { id },
      attributes: ['name', 'phone', 'sex', 'address']
    })

    const notes = await Note.findAndCountAll({
      where: { userId: id },
      attributes: ['content', 'createdAt'],
      limit: 1000,
      offset: 1000 * (page - 1),
      order: [['createdAt', 'DESC']],
      include: [
        { model: Adminer, attributes: ['name'] }
      ]
    })
    let data = notes.rows.map(item => [item.adminer.name, item.createdAt, item.content]);
    data = [
      [`客户:${user.name}-${user.phone}`, user.sex ? '女' : '男', user.address],
      ['员工', '跟踪日期', '跟踪内容'],
      ...data
    ];
    const options = { '!cols': [{ wch: 20 }, { wch: 20 }, { wch: 60 }] };
    const excel = xlsx.build([{ name: `${user.name}-${user.phone}`, data, options }]);
    this.ctx.set('Access-Control-Expose-Headers', "count")
    this.ctx.set('count', `${notes.count}`);
    return excel;
  }
}