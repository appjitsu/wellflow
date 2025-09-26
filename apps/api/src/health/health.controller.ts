import { Controller, Get, Query, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthCheckService } from './health.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthCheckService: HealthCheckService) {}

  @Get()
  @ApiOperation({ summary: 'Complete health check' })
  @ApiResponse({ status: 200, description: 'All systems healthy' })
  @ApiResponse({ status: 503, description: 'Some systems unhealthy' })
  async health() {
    const result = await this.healthCheckService.checkHealth();
    return result;
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe' })
  @ApiResponse({ status: 200, description: 'Service is ready to handle traffic' })
  @ApiResponse({ status: 503, description: 'Service is not ready' })
  async readiness() {
    const result = await this.healthCheckService.checkReadiness();
    return result;
  }

  @Get('live')
  @ApiOperation({ summary: 'Liveness probe' })
  @ApiResponse({ status: 200, description: 'Service is alive' })
  @ApiResponse({ status: 503, description: 'Service is not alive' })
  async liveness() {
    const result = await this.healthCheckService.checkLiveness();
    return result;
  }

  @Get('database')
  @ApiOperation({ summary: 'Database health check' })
  @ApiResponse({ status: 200, description: 'Database is healthy' })
  @ApiResponse({ status: 503, description: 'Database is unhealthy' })
  async databaseHealth() {
    const result = await this.healthCheckService.checkDatabase();
    return result;
  }

  @Get('redis')
  @ApiOperation({ summary: 'Redis health check' })
  @ApiResponse({ status: 200, description: 'Redis is healthy' })
  @ApiResponse({ status: 503, description: 'Redis is unhealthy' })
  async redisHealth() {
    const result = await this.healthCheckService.checkRedis();
    return result;
  }

  @Get('external')
  @ApiOperation({ summary: 'External services health check' })
  @ApiResponse({ status: 200, description: 'External services are healthy' })
  @ApiResponse({ status: 503, description: 'Some external services are unhealthy' })
  async externalHealth() {
    const result = await this.healthCheckService.checkExternalServices();
    return result;
  }

  @Get('metrics')
  @ApiOperation({ summary: 'System metrics' })
  @ApiResponse({ status: 200, description: 'System metrics' })
  async metrics() {
    return await this.healthCheckService.getSystemMetrics();
  }
}
