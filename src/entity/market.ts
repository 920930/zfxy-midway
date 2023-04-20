import { Table, Model, Column, AllowNull, Default, DataType } from 'sequelize-typescript';
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

  @Default(1)
  @Column({
    type: DataType.BOOLEAN,
    comment: '0关闭 1正常'
  })
  state: boolean;
}