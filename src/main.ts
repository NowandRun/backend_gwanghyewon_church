import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import * as dotenv from 'dotenv';

async function bootstrap() {
  // 환경 변수 로딩
  dotenv.config();

  const app = await NestFactory.create(AppModule);
  const corsOptions = {
    origin: process.env.CORS_ORIGIN?.split(',') || '*',
    credentials: true,
    methods: 'GET,HEAD,POST',
    allowedHeaders: 'Content-Type,Authorization,aat',
    exposedHeaders: 'Authorization',
  };
  app.useGlobalPipes(new ValidationPipe());
  // Cors policy 해결
  app.enableCors(corsOptions);
  app.use(cookieParser());

  await app.listen(process.env.PORT || 4000);
}
bootstrap();
