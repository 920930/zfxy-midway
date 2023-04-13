import { Provide } from '@midwayjs/core';
import { User } from '../entity/user';
// import { CustomHttpError } from '../error/custom.error';
import { Adminer } from '../entity/adminer';
import { Trade } from '../entity/trade';
import { ISearch } from '../interface';

@Provide()
export class UserService {
  async index(search: ISearch) {
    const { page = 1, size = 5, adminerId } = search;
    const where: { [key: string]: any } = {}
    adminerId && (where['adminerId'] = adminerId)
    return User.findAndCountAll({
      where,
      limit: size - 0,
      offset: size * (page - 1),
      include: [
        { model: Adminer, attributes: ['id', 'name'] },
        { model: Trade }
      ],
      order: [['createdAt', 'DESC']],
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
}