import { Configuration, App } from '@midwayjs/core';
import * as koa from '@midwayjs/koa';
import * as validate from '@midwayjs/validate';
import * as info from '@midwayjs/info';
import * as crossDomain from '@midwayjs/cross-domain';
import * as redis from '@midwayjs/redis';
import * as jwt from '@midwayjs/jwt';
import * as sequelize from '@midwayjs/sequelize';
import { join } from 'path';
import { DefaultErrorFilter } from './filter/default.filter';
import { ReportMiddleware } from './middleware/report.middleware';
import { AuthMiddleware } from './middleware/auth.middleware';
import { Adminer } from './entity/adminer';

@Configuration({
  imports: [
    koa,
    validate,
    {
      component: info,
      enabledEnvironment: ['local'],
    },
    crossDomain,
    redis,
    jwt,
    sequelize,
  ],
  importConfigs: [join(__dirname, './config')],
})
export class ContainerLifeCycle {
  @App()
  app: koa.Application;

  async onReady() {
    // add middleware
    this.app.useMiddleware([ReportMiddleware, AuthMiddleware]);
    // add filter
    this.app.useFilter([DefaultErrorFilter]);
  }
  // 初始化数据
  async onServerReady() {
    Adminer.findOrCreate({
      where: { id: 1 },
      defaults: {
        name: '张浩刚',
        phone: '18081990075',
        password: '123456',
        roleId: 1
      }
    })
  };
}
