import { makeHttpRequest } from '@midwayjs/core';
import { createHash } from 'crypto';
const APPID = 'wx7e998d6d465a5e90';
const APPSECRET = '4e8bf5923e330ceee034d8a67012faff';

interface IAccessToken {
  access_token: string;
  expires_in: number;
}

interface IJsApiTicket {
  ticket: string;
  expires_in: number;
  errcode: number
}
export const getAccessToken = async (): Promise<IAccessToken> => {
  const { data } = await makeHttpRequest(`https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${APPID}&secret=${APPSECRET}`, {
    dataType: 'json'
  });
  return data as IAccessToken;
};

export const getJsApiTicket = async (access_token: string): Promise<IJsApiTicket> => {
  const { data } = await makeHttpRequest(`https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token=${access_token}&type=jsapi`, {
    dataType: 'json'
  })
  return data as IJsApiTicket;
}

export const getSignature = (url: string, ticket: string) => {
  const noncestr = Math.random().toString(16).slice(2);
  const timestamp = Date.now();
  const str = `jsapi_ticket=${ticket}&noncestr=${noncestr}&timestamp=${timestamp}&url=${url}`;
  const signature = createHash('sha1').update(str, 'utf-8').digest('hex');
  return {
    signature,
    noncestr,
    timestamp,
    appId: APPID,
  };
}
