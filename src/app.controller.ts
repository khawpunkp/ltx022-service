import {
  Controller,
  Get,
  Param,
  Post,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { AppService } from './app.service';
import { AnyFilesInterceptor } from '@nestjs/platform-express';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('/last-vdo')
  lastVideo() {
    return this.appService.getLastVideo();
  }

  @Get('/card-list')
  cardList() {
    return this.appService.getCardList();
  }

  @Post('/upload/:code')
  @UseInterceptors(AnyFilesInterceptor())
  uploadFile(
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Param('code') code: string,
  ) {
    return this.appService.uploadCardsByRarity(code, files);
  }
}
