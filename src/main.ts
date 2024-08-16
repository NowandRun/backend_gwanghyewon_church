import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const allowedOrigins = [
    'http://localhost:3000',
    'https://wavenexus.co.kr',
    'https://www.wavenexus.co.kr',
  ];

  const app = await NestFactory.create(AppModule);
  const corsOptions = {
    origin: allowedOrigins,
    credentials: true,
    methods: 'GET,HEAD,POST',
    allowedHeaders: 'Content-Type,Authorization',
    exposedHeaders: 'Authorization',
  };
  app.useGlobalPipes(new ValidationPipe());
  // Cors policy 해결
  app.enableCors(corsOptions);
  app.use(cookieParser());

  await app.listen(process.env.PORT || 4000);
}
bootstrap();
