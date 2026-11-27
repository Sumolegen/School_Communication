import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { createGlobalValidationPipe } from '@shared/pipes/validation.pipe';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.setGlobalPrefix('api/v1');
<<<<<<< Updated upstream

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: {
        directives: {
          defaultSrc: [`'self'`],
          styleSrc: [`'self'`, `'unsafe-inline'`],
          imgSrc: [`'self'`, 'data:', 'validator.swagger.io'],
          scriptSrc: [`'self'`, `'unsafe-inline'`, `'unsafe-eval'`],
        },
      },
=======
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
>>>>>>> Stashed changes
    }),
  );

  const corsOrigins = configService.get<string[]>('app.corsOrigins') ?? ['http://localhost:5173'];
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });

  app.useGlobalPipes(createGlobalValidationPipe());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('School Communication API')
<<<<<<< Updated upstream
    .setDescription(
      'Multi-tenant white-label School Communication REST API built with NestJS, Prisma, and PostgreSQL',
    )
=======
    .setDescription('Multi-tenant white-label School Communication REST API')
>>>>>>> Stashed changes
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
<<<<<<< Updated upstream
        name: 'Authorization',
        description: 'Enter your JWT Bearer token',
        in: 'header',
      },
      'bearer',
=======
        in: 'header',
      },
      'access-token',
>>>>>>> Stashed changes
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
<<<<<<< Updated upstream
  const swaggerOptions = {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true,
    },
    customSiteTitle: 'School Communication API Documentation',
  };

  // Mount Swagger on /docs, /api/docs, and /swagger
  SwaggerModule.setup('docs', app, document, swaggerOptions);
  SwaggerModule.setup('api/docs', app, document, swaggerOptions);
  SwaggerModule.setup('swagger', app, document, swaggerOptions);
=======
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });
>>>>>>> Stashed changes

  const port = configService.get<number>('app.port') ?? 3001;
  const appName = configService.get<string>('app.name') ?? 'School Communication Backend Server';
  await app.listen(port);
<<<<<<< Updated upstream

  console.log(`🚀 ${appName} running at: http://localhost:${port}`);
  console.log(
    `📚 Swagger Documentation available at: http://localhost:${port}/docs, http://localhost:${port}/api/docs, and http://localhost:${port}/swagger`,
  );
=======
  Logger.log(`School Communication API running on http://localhost:${port}/api/v1`, 'Bootstrap');
  Logger.log(`Swagger UI available at http://localhost:${port}/api/docs`, 'Bootstrap');
>>>>>>> Stashed changes
}

bootstrap();
