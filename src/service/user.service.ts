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
    const { page = 1, size = 5, adminerId, name, phone } = search;
    const where: { [key: string]: any } = {}
    adminerId && (where['adminerId'] = adminerId)
    name && (where['name'] = { [Op.substring]: name })
    phone && (where['phone'] = { [Op.substring]: phone })
    console.log(where)
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
    const user = await User.create(data);
    // 群发消息 start
    this.authService.send({ userId: user.id, adminerId: data.adminerId, content: data.desc })
    return { id: user.id }
  }

  async edit(id: number, data: any) {
    const one = await User.findOne({ where: { phone: data.phone } });
    if (one && one.id != id) throw new CustomHttpError('手机号已存在')
    User.update(data, { where: { id } })
  }
}