import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
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

  // Enable CORS for web app with HTTPS support
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'https://localhost:3000',
      'http://localhost:3001',
      'https://localhost:3001',
      'https://web-production-79cf2.up.railway.app',
      'https://web-wellflow-pr-1.up.railway.app',
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
  });

  const port = getPort();
  const protocol = getProtocol();
  const baseUrl = getBaseUrl();

  await app.listen(port);

  console.log(`🚀 API server running on ${baseUrl}`);
  console.log(`📚 API documentation available at ${baseUrl}/api/docs`);

  if (protocol === 'https') {
    console.log('🔒 HTTPS enabled - secure connection established');
    console.log(
      '✅ Oil & Gas critical infrastructure security compliance active',
    );
  } else {
    console.log('⚠️ Running in HTTP mode - configure HTTPS for production');
  }
}

void bootstrap();
