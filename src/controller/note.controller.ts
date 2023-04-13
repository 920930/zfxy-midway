import { Controller, Inject, Get, Query } from '@midwayjs/core';
import { Context } from '@midwayjs/koa';
import { NoteService } from '../service/note.service';
import { ISearch } from '../interface';

@Controller('/api/note')
export class NoteController {
  @Inject()
  ctx: Context;

  @Inject()
  noteService: NoteService;

  @Get('/')
  async index(@Query() search: ISearch) {
    console.log('node 11111111111')
    console.log(search)
    console.log('node 11111111111')
    return this.noteService.index(search);
  }
}
