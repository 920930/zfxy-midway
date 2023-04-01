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