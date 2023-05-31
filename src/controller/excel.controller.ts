import { Controller, Inject, Get, Param } from '@midwayjs/core';
import { RedisService } from '@midwayjs/redis';
import xlsx from 'node-xlsx'
import { CustomHttpError } from '../error/custom.error';
// import * as fs from 'fs'

@Controller('/api/excel')
export class UserController {
  @Inject()
  redisService: RedisService;

  @Get('/:id')
  async oneUser(@Param('id') id: string): Promise<Buffer> {
    const datas = await this.redisService.get('zfxy-excel-' + id);
    if (!datas) throw new CustomHttpError('已过期')
    const data = JSON.parse(datas) as string[][];
    const name = data[0][0].split(':')[1];
    const options = { '!cols': [{ wch: 20 }, { wch: 20 }, { wch: 60 }] };
    const excel = xlsx.build([{ name, data, options }]);
    // fs.writeFileSync(`${__dirname}/n.xlsx`, Buffer.from(excel))
    return excel;
  }
}