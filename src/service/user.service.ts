import { App, Provide, Inject } from '@midwayjs/core';
import { Application } from '@midwayjs/koa';
import { User } from '../entity/user';
// import { CustomHttpError } from '../error/custom.error';
import { Adminer } from '../entity/adminer';
import { Trade } from '../entity/trade';
import { IMessage, ISearch, TRedisToken } from '../interface';
import { RedisService } from '@midwayjs/redis';
import { sendMessage } from '../utils/wechat';
import { Op } from 'sequelize';

@Provide()
export class UserService {
  @App()
  app: Application;

  @Inject()
  redisService: RedisService;

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
        }
      ]
    })
    return user
  }

  async store(data: any, adminerName: string) {
    const user = await User.create(data);
    // 群发消息 start
    const adminers = await Adminer.findAll({ where: { state: true, roleId: { [Op.in]: [1, 2] } }, attributes: ['openid'] })
    const tokens = await this.redisService.get('zfxy-token')
    const token: TRedisToken = JSON.parse(tokens)
    const datas: IMessage = {
      url: this.app.getConfig('koa.web') + user.id,
      first: {
        value: `${adminerName}新增一条客户信息`
      },
      keyword1: {
        value: user.name
      },
      keyword2: {
        value: user.phone
      },
      keyword3: {
        value: user.desc
      }
    }
    adminers.forEach(item => sendMessage(token.access, item.openid, datas))
    // 群发消息 end
    return { id: user.id }
  }

  async edit(id: number, data: any) {
    User.update(data, { where: { id } })
  }
}