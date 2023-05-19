import { MidwayConfig } from '@midwayjs/core';
import { Adminer } from '../entity/adminer';
import { User } from '../entity/user';
import { Note } from '../entity/note';
import { Trade } from '../entity/trade';
import { Market } from '../entity/market';
import { MarketUser } from '../entity/marketUser';

export default {
  // use for cookie sign key, should change to your own and keep security
  keys: '1680167318186_2690',
  koa: {
    port: 7001,
    web: 'http://192.168.2.116:5173',
    server: 'http://192.168.2.116:7001',
  },
  wechat: {
    appid: 'wx7e998d6d465a5e90',
    secret: '4e8bf5923e330ceee034d8a67012faff',
    templateId1: '-KO65uwQxCSR40_Nwe_P1ZNklK98Yuq0Thwwk_-ZR_k',
    templateId2: 'J5u93ong5XMOgmy2Tsu-0Aak1mzV1K48fm4pNPbag34',
    templateId3: 'fIg-BB9_PbXNUixUAcImBWdrZKrou6UKxe1WsNVfBPY',
  },
  redis: {
    client: {
      port: 6379, // Redis port
      host: '127.0.0.1', // Redis host
      password: '',
      // db: 0,
      end: 60 * 60 * 24 * 30, // 30天过期
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
        entities: [Adminer, User, Note, Trade, Market, MarketUser],
        // 本地的时候，可以通过 sync: true 直接 createTable
        sync: true,
      },
    },
  },
} as MidwayConfig;
