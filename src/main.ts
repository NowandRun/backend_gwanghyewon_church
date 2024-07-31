import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import * as csurf from 'csurf';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const corsOptions = {
    origin: true,
    credentials: true,
  };
  app.useGlobalPipes(new ValidationPipe());
  // Cors policy 해결
  app.enableCors(corsOptions);
  app.use(cookieParser());

  await app.listen(process.env.PORT || 4000);
}
bootstrap();
