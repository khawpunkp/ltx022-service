import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class AppModel {
  constructor(private readonly prisma: PrismaService) {}

  async getCardList() {
    try {
      const list = await this.prisma.rarity.findMany({
        include: { Card: true },
      });
      return list;
   } catch (error) {
      throw error;
   }
  }
}
