import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class AppModel {
   constructor(private readonly prisma: PrismaService) {}

   async getCardList() {
      try {
         const list = await this.prisma.rarity.findMany({
            include: { Card: { orderBy: { runningNumber: 'asc' } } },
            orderBy: { rare: 'asc' },
         });
         return list;
      } catch (error) {
         throw error;
      }
   }

   async getHomeImage() {
      try {
         const list = await this.prisma.homeImage.findMany();
         return list;
      } catch (error) {
         throw error;
      }
   }

   async findRarityByCode(code: string) {
      try {
         const rarity = await this.prisma.rarity.findFirst({ where: { code } });
         return rarity;
      } catch (error) {
         throw error;
      }
   }

   async createCard(data: Prisma.CardUncheckedCreateInput) {
      try {
         await this.prisma.card.create({ data });
      } catch (error) {
         throw error;
      }
   }

   async createHomeImage(data: Prisma.HomeImageCreateInput) {
      try {
         await this.prisma.homeImage.create({ data });
      } catch (error) {
         throw error;
      }
   }
}
