import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { AppModel } from './app.model';
import { PrismaService } from './prisma/prisma.service';

@Module({
   imports: [
      ConfigModule.forRoot({
         isGlobal: true,
      }),
   ],
   controllers: [AppController],
   providers: [AppService, AppModel, PrismaService],
})
export class AppModule {}
