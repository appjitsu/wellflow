import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { AppConfigService } from './config/app.config';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import {
  getHttpsOptions,
  getPort,
  getBaseUrl,
  getProtocol,
} from './config/https.config';

export async function bootstrap() {
  // Get HTTPS configuration for production
  const httpsOptions = getHttpsOptions();

  // Create NestJS application with HTTPS if configured
  const app = httpsOptions
    ? await NestFactory.create(AppModule, { httpsOptions })
    : await NestFactory.create(AppModule);

  // Get configuration service for environment variables
  const configService = app.get(AppConfigService);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Global exception filter
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Swagger API Documentation
  const config = new DocumentBuilder()
    .setTitle('WellFlow API')
    .setDescription('Oil & Gas Well Management Platform API')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Wells', 'Well management operations')
    .addTag('Vendors', 'Vendor management and qualification')
    .addTag('Title Management', 'Title opinion and curative item management')
    .addTag('AFEs', 'Authorization for Expenditure management')
    .addTag('Lease Operating Statements', 'Lease operating expense tracking')
    .addTag(
      'Daily Drilling Reports',
      'Daily drilling reporting and submission operations',
    )
    .addTag(
      'Maintenance Schedules',
      'Equipment maintenance scheduling and completion',
    )
    .addTag('Operators', 'Operator-specific operations')
    .addTag('Health', 'Health check endpoints')
    .addServer(configService.apiUrl || getBaseUrl(), 'API Server')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  // Enable CORS for web app with HTTPS support (config-driven)
  app.enableCors({
    origin: configService.corsOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
  });

  const port = getPort();
  const protocol = getProtocol();
  const baseUrl = getBaseUrl();

  await app.listen(port);

  const logger = new Logger('Bootstrap');
  logger.log(`API server running on ${baseUrl}`);
  logger.log(`API documentation available at ${baseUrl}/api/docs`);

  if (protocol === 'https') {
    logger.log('HTTPS enabled - secure connection established');
  } else {
    logger.warn('Running in HTTP mode - configure HTTPS for production');
  }
}

void bootstrap();
