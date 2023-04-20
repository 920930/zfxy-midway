import { MidwayConfig } from '@midwayjs/core';
import { Adminer } from '../entity/adminer';
import { User } from '../entity/user';
import { Note } from '../entity/note';
import { Trade } from '../entity/trade';
import { Market } from '../entity/market';

export default {
  // use for cookie sign key, should change to your own and keep security
  keys: '1680167318186_2690',
  koa: {
    port: 7001,
    web: 'http://192.168.2.116:5173',
    server: 'http://192.168.2.116:7001'
  },
  wechat: {
    appid: 'wx7e998d6d465a5e90',
    secret: '4e8bf5923e330ceee034d8a67012faff',
    templateId: '-KO65uwQxCSR40_Nwe_P1ZNklK98Yuq0Thwwk_-ZR_k'
  },
  redis: {
    client: {
      port: 6379, // Redis port
      host: "127.0.0.1", // Redis host
      password: "",
      // db: 0,
      end: 60 * 60 * 24 * 30 // 30天过期
    },
  },
  jwt: {
    secret: '415254f3-6052-4e83-9bd1-2318850ad61b',
    expiresIn: '10s',
  },
  sequelize: {
    dataSource: {
      // 第一个数据源，数据源的名字可以完全自定义
      default: {
        database: 'zfxy',
        username: 'root',
        password: '123456',
        host: '127.0.0.1',
        port: 3306,
        encrypt: false,
        dialect: 'mysql',
        define: { charset: 'utf8' },
        timezone: '+08:00',
        entities: [Adminer, User, Note, Trade, Market],
        // 本地的时候，可以通过 sync: true 直接 createTable
        sync: true,
      },
    },
  },
} as MidwayConfig;
