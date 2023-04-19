import { makeHttpRequest } from '@midwayjs/core';
import { createHash } from 'crypto';
import { CustomHttpError } from '../error/custom.error';
import * as dayjs from 'dayjs'
import { IMessage } from '../interface';

interface IAccessToken {
  access_token: string;
  expires_in: number;
}

interface IJsApiTicket {
  ticket: string;
  expires_in: number;
  errcode: number;
}

export const getAccessToken = async (APPID: string, APPSECRET: string): Promise<IAccessToken> => {
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
  };
}

// ========================== 分割  ========

export interface IWechatOpenid {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  openid: string;
}
interface IWechatInfo {
  openid: string;
  nickname: string;
  expires_in: number;
  headimgurl: string;
}

// 通过code获取用户access_token，openid等
export const getWechatUserAccessToken = (code: string, appId: string, secret: string): Promise<IWechatOpenid> => {
  return new Promise((resolve, reject) => {
    makeHttpRequest<IWechatOpenid>(`https://api.weixin.qq.com/sns/oauth2/access_token?appid=${appId}&secret=${secret}&code=${code}&grant_type=authorization_code`, {
      dataType: 'json'
    }).then(({ data }) => resolve(data as IWechatOpenid)).catch(err => reject(err))
  })
}
// refresh_token 有效期30天，access_token 有效期2小时
export const getWechatUserRefeshAccessToken = (appId: string, refresh_token: string): Promise<IWechatOpenid> => {
  return new Promise((resolve, reject) => {
    makeHttpRequest<IWechatOpenid>(`https://api.weixin.qq.com/sns/oauth2/refresh_token?appid=${appId}&grant_type=refresh_token&refresh_token=${refresh_token}`, {
      dataType: 'json'
    }).then(({ data }) => resolve(data as IWechatOpenid)).catch(err => reject(err))
  })
}

// 通过access_token获取用户信息入头像，openid等
export const getWechatUserInfo = async (access_token: string, openid: string) => {
  try {
    const { data } = await makeHttpRequest<IWechatInfo>(`https://api.weixin.qq.com/sns/userinfo?access_token=${access_token}&openid=${openid}&lang=zh_CN`, {
      dataType: 'json'
    });
    return data as IWechatInfo;
  } catch (error) {
    throw new CustomHttpError(error.errmsg)
  }
}


// 发送模板消息
export const sendMessage = async (access_token: string, openid: string, data: IMessage) => {
  makeHttpRequest(`https://api.weixin.qq.com/cgi-bin/message/template/send?access_token=${access_token}`, {
    method: "POST",
    data: {
      // touser 接收者openid
      touser: openid,
      // 中储福森
      // template_id: 'YwBjAX1MDijm17BiwfcY04-6d5MGPVbmBhfZe5K3QvU',
      // 测试平台
      template_id: '-KO65uwQxCSR40_Nwe_P1ZNklK98Yuq0Thwwk_-ZR_k',
      url: data.url,
      data: {
        first: {
          value: data.first.value,
        },
        keyword1: {
          value: data.keyword1.value,
          color: data.keyword2.color || "#1d1d1d",
        },
        keyword2: {
          value: data.keyword2.value,
          color: data.keyword2.color || "#1d1d1d"
        },
        keyword3: {
          value: data.keyword3.value,
          color: data.keyword2.color || "#173177"
        },
        remark: {
          value: data.remark?.value || dayjs().format('YYYY-MM-DD HH:mm:ss'),
          // color: "#173177"
        }
      }
    },
    dataType: 'json'
  }).then(({ data }) => data).catch(err => console.log(err))
}
