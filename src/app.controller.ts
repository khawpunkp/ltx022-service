import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

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
}
