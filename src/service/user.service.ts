import { App, Provide, Inject } from '@midwayjs/core';
import { Application } from '@midwayjs/koa';
import { User } from '../entity/user';
import { RedisService } from '@midwayjs/redis';
import { Op } from 'sequelize';
import { Adminer } from '../entity/adminer';
import { Trade } from '../entity/trade';
import type { ISearch } from '../interface';
import { Market } from '../entity/market';
import { CustomHttpError } from '../error/custom.error';
import { MsgService } from './msg.service';

@Provide()
export class UserService {
  @App()
  app: Application;

  @Inject()
  redisService: RedisService;

  @Inject()
  msgService: MsgService;

  async index(search: ISearch) {
    const { page = 1, size = 5, adminerId, name, phone, state } = search;
    const where: { [key: string]: any } = {};
    adminerId && (where['adminerId'] = adminerId);
    name && (where['name'] = { [Op.substring]: name });
    phone && (where['phone'] = { [Op.substring]: phone });
    state != undefined && (where['state'] = state);
    return User.findAndCountAll({
      where,
      limit: size - 0,
      offset: size * (page - 1),
      include: [
        { model: Adminer, attributes: ['id', 'name'] },
        { model: Trade },
      ],
      order: [['createdAt', 'DESC']],
      distinct: true,
    });
  }

  async show(id: number) {
    const user = await User.findOne({
      where: { id },
      include: [
        {
          model: Adminer,
          attributes: ['id', 'name'],
        },
        {
          model: Trade,
        },
        {
          model: Market,
        },
      ],
    });
    return user;
  }

  async store(data: any) {
    const one = await User.findOne({ where: { phone: data.phone } });
    if (one) throw new CustomHttpError('手机号已存在');
    let marketIds: string[] = (data.markets as string)
      .split(',')
      .map(item => item.split('-')[0]);
    const markets = await Market.findAll({ where: { id: marketIds } });
    const user = await User.create(data);
    user.$set('markets', markets);
    // 群发消息 start
    this.msgService.send({
      userId: user.id,
      adminerId: data.adminerId,
      content: data.desc,
    });
    // 新增客户后，6天后提醒员工新增客户 1000 * 60 * 60 * 24 * 6
    const info = {
      id: data.adminerId,
      time: Date.now() + 1000 * 60 * 60 * 24 * 7,
    };
    const redisDatas = await this.redisService.get('zfxy-yuqi-user');
    if (!redisDatas) {
      this.redisService.set('zfxy-yuqi-user', JSON.stringify([info]));
    } else {
      const yuqis: { id: number; time: number }[] = JSON.parse(redisDatas);
      const one = yuqis.find(item => item.id == data.adminerId);
      if (!one) yuqis.push(info);
      else one.time = Date.now() + 1000 * 60 * 60 * 24 * 7;
      this.redisService.set('zfxy-yuqi-user', JSON.stringify(yuqis));
    }
    return { id: user.id };
  }

  async edit(id: number, data: any, adminId: string) {
    const one = await User.findOne({ where: { phone: data.phone } });
    if (one && one.id != id) throw new CustomHttpError('手机号已存在');
    const user = await User.findByPk(id);
    if (user.adminerId != Number.parseInt(adminId))
      throw new CustomHttpError('此客户不是您的客户');

    let marketIds: string[] = (data.markets as string)
      .split(',')
      .map(item => item.split('-')[0]);
    const markets = await Market.findAll({ where: { id: marketIds } });
    delete data['markets'];
    await user.$set('markets', markets);
    await User.update(data, { where: { id } });
    return 'ok';
  }

  async move(id: string, toAid: string, ctxAdminId: number) {
    const user = await User.findOne({
      where: { id },
      include: { model: Adminer },
    });
    if (user.adminerId == Number.parseInt(toAid)) {
      throw new CustomHttpError('客户没有转移');
    }
    this.msgService.move(
      { id: user.id, name: user.name, phone: user.phone },
      user.adminerId,
      Number.parseInt(toAid),
      ctxAdminId
    );
    await User.update({ adminerId: toAid }, { where: { id } });
    return 'ok';
  }
}
