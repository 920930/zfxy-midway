import { Table, Model, Column, DataType, Default, AllowNull } from 'sequelize-typescript';
import { md5 } from '../utils';

@Table({
  timestamps: true
})
export class Adminer extends Model {
  @AllowNull(false)
  @Column
  name: string;

  @AllowNull(false)
  @Column
  phone: string;

  @AllowNull(false)
  @Column({
    get() {
      return this.getDataValue('password')
    },
    set(val: string) {
      this.setDataValue('password', md5(val))
    }
  })
  password: string;

  @Column({
    comment: '头像'
  })
  avatar: string;

  @Default(0)
  @Column({
    type: DataType.TINYINT,
    comment: '管理员权限 1超级管理员 2管理员 3员工',
  })
  roleId: number;

  @Column({
    comment: '微信公众号openid'
  })
  openid: string;

  @Default(1)
  @Column({
    comment: '员工状态 1正常 0关闭'
  })
  state: boolean;
}