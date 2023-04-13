import { Table, Model, Column, DataType, Default, AllowNull, BelongsTo, ForeignKey, CreatedAt } from 'sequelize-typescript';
import { Adminer } from './adminer';
import { User } from './user';
import * as dayjs from 'dayjs';

@Table({
  timestamps: true
})
export class Note extends Model {
  @AllowNull(false)
  @Column({
    comment: '跟踪记录'
  })
  content: string;

  @Default(1)
  @Column({
    type: DataType.TINYINT,
    comment: '客户状态 0无效客户 1跟踪中 2签约客户'
  })
  state: number;

  @ForeignKey(() => Adminer)
  @Column
  adminerId: number;

  @BelongsTo(() => Adminer)
  adminer: Adminer;

  @ForeignKey(() => User)
  @Column
  userId: number;

  @BelongsTo(() => User)
  user: User;

  @CreatedAt
  @Column({
    get() {
      return dayjs(this.getDataValue('createdAt')).format('YYYY-MM-DD HH:mm')
    }
  })
  createdAt: Date;
}