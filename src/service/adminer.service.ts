import { Provide } from '@midwayjs/core';
import { Adminer } from '../entity/adminer';
// import { CustomHttpError } from '../error/custom.error';

@Provide()
export class AdminerService {
  async me(id: number){
    return Adminer.findOne({
      where: { id },
      attributes: { exclude: ['password', 'openid'] },
      // attributes: ['foo', 'bar']
    })
  }
}