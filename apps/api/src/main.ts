import { NestFactory } from '@nestjs/core';
import { RequestMethod, ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module.js';
import cookieParser from 'cookie-parser';

const getAllowedOrigins = () => {
  const configuredOrigins = [
    process.env.FRONTEND_URL,
    process.env.NEXT_PUBLIC_API_URL,
  ]
    .filter(Boolean)
    .flatMap((url) => {
      try {
        return [new URL(url as string).origin];
      } catch {
        return [];
      }
    });

  return Array.from(
    new Set([
      'http://localhost:3000',
      'http://localhost:3001',
      'http://opato.web.id',
      'http://www.opato.web.id',
      ...configuredOrigins,
    ]),
  );
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());

  app.enableCors({
    origin: getAllowedOrigins(),
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  app.setGlobalPrefix('api', {
    exclude: [{ path: '', method: RequestMethod.GET }],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
    }),
  );

  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  const config = new DocumentBuilder()
    .setTitle('API')
    .setDescription('Backend API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, documentFactory);

  await app.listen(process.env.PORT ?? 3001);
}

void bootstrap();
