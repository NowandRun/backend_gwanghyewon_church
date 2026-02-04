import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const corsOptions = {
    origin: true,
    credentials: true,
  };
  app.useGlobalPipes(new ValidationPipe());
  // Cors policy 해결
  app.enableCors(corsOptions);
  await app.listen(process.env.PORT || 4000);
}
bootstrap();
