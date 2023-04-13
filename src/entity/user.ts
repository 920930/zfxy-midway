import { Table, Model, Column, DataType, Default, AllowNull, BelongsTo, HasMany, ForeignKey, CreatedAt } from 'sequelize-typescript';
import { Adminer } from './adminer';
import { Note } from './note';
import * as dayjs from 'dayjs';
import { Trade } from './trade';

@Table({
  timestamps: true
})
export class User extends Model {
  @AllowNull(false)
  @Column({
    type: DataType.STRING(20)
  })
  name: string;

  @AllowNull(false)
  @Column({
    type: DataType.STRING(20)
  })
  phone: string;

  @AllowNull(false)
  @Column({
    comment: '客户简介'
  })
  desc: string;

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

  @HasMany(() => Note)
  notes: Note[];

  @ForeignKey(() => Trade)
  @Column
  tradeId: number;

  @BelongsTo(() => Trade)
  trade: Trade;

  @CreatedAt
  @Column({
    get() {
      return dayjs(this.getDataValue('createdAt')).format('YYYY-MM-DD')
    }
  })
  createdAt: Date;
}