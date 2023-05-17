import { App, Provide, Inject } from '@midwayjs/core';
import { Application } from '@midwayjs/koa';
import { User } from '../entity/user';
// import { CustomHttpError } from '../error/custom.error';
import { Adminer } from '../entity/adminer';
import { Trade } from '../entity/trade';
import { ISearch } from '../interface';
import { RedisService } from '@midwayjs/redis';
import { Op } from 'sequelize';
import { AuthService } from './auth.service';
import { Market } from '../entity/market';
import { CustomHttpError } from '../error/custom.error';

@Provide()
export class UserService {
  @App()
  app: Application;

  @Inject()
  redisService: RedisService;

  @Inject()
  authService: AuthService;

  async index(search: ISearch) {
    const { page = 1, size = 5, adminerId, name, phone, state } = search;
    const where: { [key: string]: any } = {}
    adminerId && (where['adminerId'] = adminerId)
    name && (where['name'] = { [Op.substring]: name })
    phone && (where['phone'] = { [Op.substring]: phone })
    state != undefined && (where['state'] = state)
    return User.findAndCountAll({
      where,
      limit: size - 0,
      offset: size * (page - 1),
      include: [
        { model: Adminer, attributes: ['id', 'name'] },
        { model: Trade }
      ],
      order: [['createdAt', 'DESC']],
      distinct: true,
    })
  }

  async show(id: number) {
    const user = await User.findOne({
      where: { id },
      include: [
        {
          model: Adminer,
          attributes: ['id', 'name']
        },
        {
          model: Trade
        },
        {
          model: Market
        }
      ]
    })
    return user
  }

  async store(data: any) {
    const one = await User.findOne({ where: { phone: data.phone } })
    if (one) throw new CustomHttpError('手机号已存在')
    let marketIds: string[] = (data.markets as string).split(',').map(item => item.split('-')[0]);
    const markets = await Market.findAll({ where: { id: marketIds } })
    const user = await User.create(data);
    user.$add('markets', markets)
    // 群发消息 start
    this.authService.send({ userId: user.id, adminerId: data.adminerId, content: data.desc })
    return { id: user.id }
  }

  async edit(id: number, data: any, adminId: string) {
    const one = await User.findOne({ where: { phone: data.phone } });
    if (one && one.id != id) throw new CustomHttpError('手机号已存在');
    const user = await User.findByPk(id);
    if (user.adminerId != Number.parseInt(adminId)) throw new CustomHttpError('此客户不是您的客户')

    let marketIds: string[] = (data.markets as string).split(',').map(item => item.split('-')[0])
    const markets = await Market.findAll({ where: { id: marketIds } })
    delete data['markets']
    await user.$set('markets', markets)
    await User.update(data, { where: { id } })
    return 'ok'
  }

  async move(id: string, toAid: string, ctxAdminId: number) {
    const user = await User.findOne({ where: { id }, include: { model: Adminer } });
    if (user.adminerId == Number.parseInt(toAid)) {
      throw new CustomHttpError('客户没有转移')
    }
    this.authService.move({ id: user.id, name: user.name, phone: user.phone }, user.adminerId, Number.parseInt(toAid), ctxAdminId)
    await User.update({ adminerId: toAid }, { where: { id } })
    return 'ok'
  }
}