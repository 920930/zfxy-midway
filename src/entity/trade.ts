import { Table, Model, Column, DataType, Default, AllowNull } from 'sequelize-typescript';
// 装修、建材行业
@Table({
  timestamps: false
})
export class Trade extends Model {
  @AllowNull(false)
  @Column({
    comment: '行业名称'
  })
  name: string;

  @Default(1)
  @Column({
    type: DataType.BOOLEAN,
    comment: '0关闭 1正常'
  })
  state: boolean;
}