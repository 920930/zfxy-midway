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
  phone?: string;
  page?: number;
  size?: number;
}