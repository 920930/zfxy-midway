import { makeHttpRequest } from '@midwayjs/core';
import { createHash } from 'crypto';
import { CustomHttpError } from '../error/custom.error';
const APPID = 'wx7e998d6d465a5e90';
const APPSECRET = '4e8bf5923e330ceee034d8a67012faff';

interface IAccessToken {
  access_token: string;
  expires_in: number;
}

interface IJsApiTicket {
  ticket: string;
  expires_in: number;
  errcode: number;
}

interface IWechatOpenid {
  access_token: string;
  expires_in: number;
  openid: string;
}
interface IWechatInfo {
  openid: string;
  nickname: string;
  expires_in: number;
  headimgurl: string;
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
  const noncestr = '1234' || Math.random().toString(16).slice(2);
  const timestamp = 1234 || Date.now();
  const str = `jsapi_ticket=${ticket}&noncestr=${noncestr}&timestamp=${timestamp}&url=${url}`;
  const signature = createHash('sha1').update(str, 'utf-8').digest('hex');
  return {
    signature,
    noncestr,
    timestamp,
  };
}

// 通过code获取用户access_token，openid等
export const getWechatUserAccessToken = async (code: string, appId: string, secret: string) => {
  try {
    const { data }= await makeHttpRequest(`https://api.weixin.qq.com/sns/oauth2/access_token?appid=${appId}&secret=${secret}&code=${code}&grant_type=authorization_code`, {
      dataType: 'json'
    }) as { data: IWechatOpenid};
    return data;
  } catch (error) {
    throw new CustomHttpError(error.errmsg)
  }
}

// 通过access_token获取用户信息入头像，openid等
export const getWechatUserInfo = async (access_token: string, openid: string) => {
  try {
    const { data } = await makeHttpRequest(`https://api.weixin.qq.com/sns/userinfo?access_token=${access_token}&openid=${openid}&lang=zh_CN`, {
      dataType: 'json'
    }) as { data: IWechatInfo };
    return data;
  } catch (error) {
    throw new CustomHttpError(error.errmsg)
  }
}


// 发送模板消息
export const sendMessage = async (access_token: string, openid: string) => {
  await makeHttpRequest(`https://api.weixin.qq.com/cgi-bin/message/template/send?access_token=${access_token}`, {
    method: "POST",
    data: {
      // touser 接收者openid
      touser: openid,
      // 中储福森
      // template_id: 'dctJ6ZGJvF6US-HkU3Cc_N-GxvsbNgArGb0VXz1ZuSA',
      // 测试平台
      template_id: 'YbKKrmyjsXxn4-TEsF0xG6qaay9zf5eLuqq8d7yppfE',
      url: `http://tp.zcfsjt.com/show`,
      data: {
        first: {
          value: '你好，员工：杀杀杀 新增了什么',
        },
        keyword1: {
          value: '0.00',
          color: "#1d1d1d",
        },
        keyword2: {
          value: '中储福森',
          color: "#1d1d1d",
        },
        remark: {
          value: "已签到成功，感谢您对中储福森集团的支持！中储福森大牌不贵，实惠！",
          color: "#173177"
        }
      }
    },
    dataType: 'json'
  });
}