import { Table, Model, Column, ForeignKey } from 'sequelize-typescript';
import { User } from './user';
import { Market } from './market';

@Table({
  timestamps: false
})
export class MarketUser extends Model {
  @ForeignKey(() => User)
  @Column
  userId: number;

  @ForeignKey(() => Market)
  @Column
  marketId: number;
}