import { Controller, Inject, Get, Query, Param, Put, Body, Post, Del } from '@midwayjs/core';
import { Context } from '@midwayjs/koa';
import { NoteService } from '../service/note.service';
import { ISearch } from '../interface';
import { CustomHttpError } from '../error/custom.error';

@Controller('/api/note')
export class NoteController {
  @Inject()
  ctx: Context;

  @Inject()
  noteService: NoteService;

  @Get('/')
  async index(@Query() search: ISearch) {
    return this.noteService.index(search);
  }

  @Get('/:id')
  async show(@Param('id') id: number) {
    return this.noteService.show(id);
  }

  @Put('/:id')
  async edit(@Param('id') id: number, @Body('content') content: string) {
    if (content.length < 5) throw new CustomHttpError('内容不能少于5个字符')
    return this.noteService.edit(id, content);
  }

  @Post('/store')
  async store(@Body() info: { content: string; userId: number; adminerId: number }) {
    if (info.content.length < 5) throw new CustomHttpError('内容不能少于5个字符')
    info.adminerId = this.ctx.adminer.id
    return this.noteService.store(info);
  }

  @Del('/:id')
  async del(@Param('id') id: number) {
    return this.noteService.del(id, this.ctx.adminer.id)
  }
}
