import { Table, Model, Column, AllowNull, Default, DataType, BelongsToMany } from 'sequelize-typescript';
import { User } from './user';
import { MarketUser } from './marketUser';
// 中储福森市场
@Table({
  timestamps: false
})
export class Market extends Model {
  @AllowNull(false)
  @Column({
    comment: '市场名称'
  })
  name: string;

  @BelongsToMany(() => User, () => MarketUser)
  users: User[];

  @Default(1)
  @Column({
    type: DataType.BOOLEAN,
    comment: '0关闭 1正常'
  })
  state: boolean;
}