import { Provide } from '@midwayjs/core';
import { Adminer } from '../entity/adminer';
import { User } from '../entity/user';
import { Note } from '../entity/note';
import { Sequelize } from 'sequelize-typescript';
import { Trade } from '../entity/trade';
import { ISearch } from '../interface';

@Provide()
export class AdminerService {

  async index(search: ISearch) {
    const { page = 1, size = 10 } = search
    return Adminer.findAndCountAll({
      limit: size - 0,
      offset: size * (page - 1),
      attributes: ['id', 'name', 'avatar', 'phone']
    })
  }

  async me(id: number) {
    return Adminer.findOne({
      where: { id },
      attributes: { exclude: ['password', 'openid'] },
      // attributes: ['foo', 'bar']
    })
  }

  async show(id: number, limit: number = 5) {
    return Adminer.findOne({
      where: { id },
      attributes: {
        exclude: ['password', 'openid'],
        include: [
          [Sequelize.literal(`(select count(*) from users where adminerId = ${id})`), 'userCount'],
          [Sequelize.literal(`(select count(*) from notes where adminerId = ${id})`), 'noteCount'],
        ]
      },
      // attributes: ['foo', 'bar']
      include: [
        { model: User, limit, order: [['id', 'DESC']], include: [{ model: Trade }] },
        { model: Note, limit, order: [['id', 'DESC']], include: [{ model: User }] },
      ]
    })
  }
}