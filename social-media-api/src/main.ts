import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // --- FIX IS HERE ---
  // We enable CORS and specify that only requests from our frontend's
  // origin are allowed. This is a crucial security practice.
  app.enableCors({
    origin: 'http://localhost:3000', // The origin of your Next.js app
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  await app.listen(3001);
}
bootstrap();
