import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const allowedOrigins = [
   'https://missyouluna.vercel.app',
   'https://ltx022-fanweb.vercel.app',
   'http://localhost:3000',
];

const corsOptions = {
   origin: function (origin, callback) {
      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
         callback(null, origin); // Allow the origin
      } else {
         callback(new Error('Not allowed by CORS')); // Reject the request
      }
   },
   methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'], // Allowed methods
};

async function bootstrap() {
   const app = await NestFactory.create(AppModule);
   const configService = app.get<ConfigService>(ConfigService);

   app.enableCors(corsOptions);

   app.setGlobalPrefix(configService.get('API_PREFIX') || '/api');

   app.enableVersioning({
      type: VersioningType.URI,
      defaultVersion: configService.get('API_VERSION') || '1',
   });

   const port = configService.get('APP_PORT') || 3001;

   await app.listen(port);
   console.log('server is running on : http://localhost:' + port);
}
bootstrap();
