/**
 * @description User-Service parameters
 */
export interface IUserOptions {
  uid: number;
}

/**
 * @description Auth-Service parameters
 */

export interface IAuthLogin {
  phone: string;
  password: string;
  code: string
}

export type TRedisInfo = {
  id: number;
  roleId: number;
  openid: string;
  now: number;
  state: boolean;
}

export type TRedisToken = {
  access: string;
  ticket: string;
}

export interface ISearch {
  id?: number;
  adminerId?: number;
  userId?: number;
  name?: string;
  phone?: string;
  page?: number;
  size?: number;
  roleId?: number;
  state?: number;
}

export interface IMessage {
  url?: string;
  first?: {
    value: string;
    color?: string;
  };
  keyword1: {
    value: string;
    color?: string;
  };
  keyword2: {
    value: string;
    color?: string;
  };
  keyword3: {
    value: string;
    color?: string;
  };
  remark?: {
    value: string;
    color?: string;
  };
}