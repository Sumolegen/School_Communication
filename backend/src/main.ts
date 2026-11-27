import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { createGlobalValidationPipe } from '@shared/pipes/validation.pipe';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.setGlobalPrefix('api/v1');
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

  const corsOrigins = configService.get<string[]>('app.corsOrigins') ?? ['http://localhost:5173'];
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });

  app.useGlobalPipes(createGlobalValidationPipe());

  const port = configService.get<number>('app.port') ?? 3001;
  await app.listen(port);
  Logger.log(`School Communication API running on http://localhost:${port}/api/v1`, 'Bootstrap');
}

bootstrap();
