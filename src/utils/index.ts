import { createHash } from 'crypto';

export const md5 = (val: string) => createHash('sha1').update(val, 'utf-8').digest('hex')