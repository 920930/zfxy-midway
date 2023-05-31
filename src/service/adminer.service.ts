import { Provide, Inject } from '@midwayjs/core';
import { RedisService } from '@midwayjs/redis';
import { Sequelize } from 'sequelize-typescript';
import { Adminer } from '../entity/adminer';
import { User } from '../entity/user';
import { Note } from '../entity/note';
import { Trade } from '../entity/trade';
import { ISearch } from '../interface';
import { CustomHttpError } from '../error/custom.error';

@Provide()
export class AdminerService {

  @Inject()
  redisService: RedisService;

  async index(search: ISearch) {
    const { page = 1, size = 30, roleId = null } = search;
    const where: { [key: string]: any } = {};
    roleId != null && (where['roleId'] = roleId)
    return Adminer.findAndCountAll({
      limit: size - 0,
      offset: size * (page - 1),
      where,
      attributes: ['id', 'name', 'avatar', 'phone', 'roleId', 'state']
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
          [Sequelize.literal(`(select count(*) from Users where adminerId = ${id})`), 'userCount'],
          [Sequelize.literal(`(select count(*) from Notes where adminerId = ${id})`), 'noteCount'],
        ]
      },
      // attributes: ['foo', 'bar']
      include: [
        { model: User, limit, order: [['id', 'DESC']], include: [{ model: Trade }] },
        { model: Note, limit, order: [['id', 'DESC']], include: [{ model: User }] },
      ]
    })
  }

  async edit(id: number, uid: string, data: any) {
    await this.checkValid(id, uid, data)
    if (!data.state) {
      this.redisService.del('zfxy-adminer-' + uid)
    }
    Adminer.update(data, { where: { id: uid } })
    return '修改成功'
  }

  async store(id: number, data: any) {
    if (!data.password) throw new CustomHttpError('请输入密码')
    await this.checkValid(id, '0', data)
    const ader = await Adminer.findOne({ where: { phone: data.phone } })
    if (ader) throw new CustomHttpError('手机号已存在')
    Adminer.create(data)
    return '新增成功'
  }

  async checkValid(id: number, uid: string, data: any) {
    const me: { id: number; roleId: number } = JSON.parse(await this.redisService.get(`zfxy-adminer-${id}`));
    if (![1, 2, 3].includes(data.roleId)) {
      throw new CustomHttpError('角色权限错误')
    }
    // 新增判断
    if (uid == '0') {
      if (me.roleId == 3) throw new CustomHttpError('您没有权限')
      if (me.roleId == 2 && (data.roleId != 3)) throw new CustomHttpError('您没有权限')
    }
    // 编辑判断
    if (uid != '0') {
      if (me.roleId == 3 && me.id !== Number.parseInt(uid)) throw new CustomHttpError('您没有权限')
      if (me.roleId == 2 && (data.roleId != 3)) throw new CustomHttpError('您没有权限')
    }
    if (data.password.length < 6) throw new CustomHttpError('密码长度不少于6')
    if (data.password && data.password != data.passwordConfig) throw new CustomHttpError('两次密码不一致')
    if (!/^1[3-9]\d{9}$/.test(data.phone)) throw new CustomHttpError('手机号不正确')
  }
}