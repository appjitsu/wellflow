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

  // Enhanced Swagger API Documentation
  const config = new DocumentBuilder()
    .setTitle('WellFlow API - Oil & Gas Well Management Platform')
    .setDescription(`
# WellFlow API

A comprehensive, enterprise-grade API for oil & gas well management, designed with critical infrastructure security and compliance in mind.

## 🚀 Features

- **Multi-tenant Architecture**: Organization-based data isolation
- **Audit Logging**: Complete audit trail for all operations
- **Circuit Breaker Pattern**: Resilient external API integrations
- **API Versioning**: Backward-compatible versioning strategy
- **Advanced Caching**: Multi-level caching for optimal performance
- **Security-First**: Comprehensive security headers and validation
- **Health Monitoring**: Real-time system health and performance metrics

## 🔐 Authentication

All API endpoints require JWT Bearer token authentication except health checks.

\`\`\`
Authorization: Bearer <your-jwt-token>
\`\`\`

## 📊 Rate Limiting

API requests are rate-limited based on user tier:
- **Free Tier**: 60 requests/minute
- **Standard**: 120 requests/minute
- **Enterprise**: 300 requests/minute

## 🔄 API Versions

- **v1**: Legacy API (deprecated)
- **v2**: Current stable API with enhanced features

Use the \`API-Version\` header to specify version:
\`\`\`
API-Version: v2
\`\`\`

## 🏷️ Response Format

All responses follow a consistent format:

\`\`\`json
{
  "success": true,
  "message": "Operation completed",
  "data": { ... },
  "timestamp": "2024-01-01T12:00:00.000Z"
}
\`\`\`

## 📋 Compliance

This API complies with:
- **IEC 62443**: Industrial Cybersecurity Standards
- **NIST CSF**: Cybersecurity Framework
- **API-1164**: Oil & Gas Industry API Standards
- **CISA**: Cybersecurity Performance Goals

## 🆘 Support

For API support, contact: api-support@wellflow.com
Security issues: security@wellflow.com
    `)
    .setVersion('2.0.0')
    .setContact('API Support', 'api-support@wellflow.com', 'support@wellflow.com')
    .setLicense('Enterprise License', 'https://wellflow.com/license')
    .setTermsOfService('https://wellflow.com/terms')
    .setExternalDoc('API Changelog', 'https://wellflow.com/api/changelog')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addApiKey(
      {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key',
      },
      'api-key',
    )
    .addTag('Wells', 'Well lifecycle management - creation, updates, status tracking')
    .addTag('Vendors', 'Vendor management, qualification, and performance tracking')
    .addTag('Title Management', 'Title opinion management and curative item processing')
    .addTag('AFEs', 'Authorization for Expenditure - budget management and approvals')
    .addTag('Lease Operating Statements', 'Lease operating expense tracking and reporting')
    .addTag('Daily Drilling Reports', 'Daily drilling operations reporting and compliance')
    .addTag('Maintenance Schedules', 'Equipment maintenance scheduling and completion tracking')
    .addTag('Production Records', 'Production data collection and analytics')
    .addTag('Regulatory Reporting', 'Automated regulatory compliance reporting')
    .addTag('Financial', 'Financial operations - payments, cash calls, revenue distribution')
    .addTag('Audit', 'Audit logging and compliance monitoring (Admin/Auditor only)')
    .addTag('Health', 'System health checks and monitoring')
    .addTag('Monitoring', 'System metrics and performance monitoring')
    .addTag('API', 'API metadata and versioning information')
    .addServer(configService.apiUrl || getBaseUrl(), 'Production API Server')
    .addServer('http://localhost:3000', 'Local Development Server')
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
