import { Provide } from '@midwayjs/core';
import { Note } from '../entity/note';
import { Adminer } from '../entity/adminer';
import { ISearch } from '../interface';
import { User } from '../entity/user';

@Provide()
export class NoteService {
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
      order: [['createdAt', 'DESC']],
      distinct: true,
    })
  }
}