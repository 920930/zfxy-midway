import { MidwayConfig } from '@midwayjs/core';

export default {
  // use for cookie sign key, should change to your own and keep security
  keys: '1680167318186_2690',
  koa: {
    port: 7001,
  },
  redis: {
    client: {
      port: 6379, // Redis port
      host: "127.0.0.1", // Redis host
      password: "",
      // db: 0,
    },
  },
} as MidwayConfig;
