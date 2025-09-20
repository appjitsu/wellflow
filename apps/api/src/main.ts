import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { SentryExceptionFilter } from './common/filters/sentry-exception.filter';
import { SentryService } from './sentry/sentry.service';

export async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Get Sentry service for exception filter
  const sentryService = app.get(SentryService);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Global exception filter with Sentry integration
  app.useGlobalFilters(new SentryExceptionFilter(sentryService));

  // Swagger API Documentation
  const config = new DocumentBuilder()
    .setTitle('WellFlow API')
    .setDescription('Oil & Gas Well Management Platform API')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Wells', 'Well management operations')
    .addTag('Health', 'Health check endpoints')
    .addServer(process.env.API_URL || 'http://localhost:3001', 'Development')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  // Enable CORS for web app
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://web-production-79cf2.up.railway.app',
      'https://web-wellflow-pr-1.up.railway.app',
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
  });

  const port = process.env.PORT ?? 3001;
  await app.listen(port);

  console.log(`🚀 API server running on port ${port}`);
  console.log(
    `📚 API documentation available at http://localhost:${port}/api/docs`,
  );
}

void bootstrap();
