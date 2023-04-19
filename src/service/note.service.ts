import { App, Provide, Inject } from '@midwayjs/core';
import { Application } from '@midwayjs/koa';
import { Note } from '../entity/note';
import { Adminer } from '../entity/adminer';
import { IMessage, ISearch, TRedisToken } from '../interface';
import { User } from '../entity/user';
import { CustomHttpError } from '../error/custom.error';
import { RedisService } from '@midwayjs/redis';
import { sendMessage } from '../utils/wechat';
import { Op } from 'sequelize';

@Provide()
export class NoteService {
  @App()
  app: Application;

  @Inject()
  redisService: RedisService;

  async index(search: ISearch) {
    const { userId, page = 1, size = 2, adminerId } = search;
    const where: { [key: string]: any } = {};
    userId && (where['userId'] = userId)
    adminerId && (where['adminerId'] = adminerId)

    return Note.findAndCountAll({
      where,
      limit: size - 0,
      offset: size * (page - 1),
      include: [
        { model: Adminer, attributes: ['id', 'name'] },
        { model: User, attributes: ['id', 'name', 'state'] },
      ],
      order: [['updatedAt', 'DESC']],
      distinct: true,
    })
  }

  async show(id: number) {
    return Note.findOne({ where: { id } })
  }

  async edit(id: number, content: string) {
    return Note.update({ content }, { where: { id } })
  }

  async store(info: { content: string; userId: number; adminerId: number }) {
    // 群发消息 start
    const adminers = await Adminer.findAll({ where: { state: true, roleId: { [Op.in]: [1, 2] } }, attributes: ['id', 'name', 'openid'] })
    const tokens = await this.redisService.get('zfxy-token')
    const token: TRedisToken = JSON.parse(tokens)
    const user = await User.findByPk(info.userId)
    const datas: IMessage = {
      url: this.app.getConfig('koa.web') + info.userId,
      first: {
        value: `${adminers.find(item => item.id == info.adminerId).name}新增一条客户跟踪记录`
      },
      keyword1: {
        value: user.name
      },
      keyword2: {
        value: user.phone
      },
      keyword3: {
        value: info.content
      }
    }
    adminers.forEach(item => sendMessage(token.access, item.openid, datas))
    // 群发消息 end
    return Note.create(info)
  }

  async del(id: number, aid: number) {
    const note = await Note.findOne({ where: { id } })
    if (note.adminerId != aid) throw new CustomHttpError('您无权删除')
    return Note.destroy({ where: { id } })
  }
}