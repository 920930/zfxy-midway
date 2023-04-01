import { HttpStatus, MidwayHttpError } from '@midwayjs/core';

export class CustomHttpError extends MidwayHttpError {
  constructor(msg: string, status = HttpStatus.BAD_REQUEST) {
    super(msg, status);
  }
}