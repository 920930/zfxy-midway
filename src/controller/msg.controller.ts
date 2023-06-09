import { Inject, Controller, Get } from '@midwayjs/core';
import { MsgService } from '../service/msg.service';

@Controller('/api/msg')
export class MsgController {
  @Inject()
  msgService: MsgService;

  @Get('/')
  index() {
    return this.msgService.index();
  }
}
