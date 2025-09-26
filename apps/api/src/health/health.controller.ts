import { Controller, Get } from '@nestjs/common';
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
  async health(): Promise<{
    status: 'healthy' | 'unhealthy';
    timestamp: string;
    uptime: number;
    version: string;
    checks: Record<
      string,
      {
        status: 'healthy' | 'unhealthy' | 'degraded';
        responseTime?: number;
        error?: string;
        details?: Record<string, unknown>;
      }
    >;
  }> {
    return await this.healthCheckService.checkHealth();
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe' })
  @ApiResponse({
    status: 200,
    description: 'Service is ready to handle traffic',
  })
  @ApiResponse({ status: 503, description: 'Service is not ready' })
  async readiness(): Promise<{
    status: 'ready' | 'not_ready';
    timestamp: string;
    dependencies: Record<string, boolean>;
  }> {
    return await this.healthCheckService.checkReadiness();
  }

  @Get('live')
  @ApiOperation({ summary: 'Liveness probe' })
  @ApiResponse({ status: 200, description: 'Service is alive' })
  @ApiResponse({ status: 503, description: 'Service is not alive' })
  async liveness(): Promise<{
    status: 'alive' | 'dead';
    timestamp: string;
    checks: Record<string, boolean>;
  }> {
    return await this.healthCheckService.checkLiveness();
  }

  @Get('database')
  @ApiOperation({ summary: 'Database health check' })
  @ApiResponse({ status: 200, description: 'Database is healthy' })
  @ApiResponse({ status: 503, description: 'Database is unhealthy' })
  async databaseHealth(): Promise<{
    status: 'healthy' | 'unhealthy';
    responseTime: number;
    details?: Record<string, unknown>;
    error?: string;
  }> {
    return await this.healthCheckService.checkDatabase();
  }

  @Get('redis')
  @ApiOperation({ summary: 'Redis health check' })
  @ApiResponse({ status: 200, description: 'Redis is healthy' })
  @ApiResponse({ status: 503, description: 'Redis is unhealthy' })
  async redisHealth(): Promise<{
    status: 'healthy' | 'unhealthy';
    responseTime: number;
    details?: Record<string, unknown>;
    error?: string;
  }> {
    return await this.healthCheckService.checkRedis();
  }

  @Get('external')
  @ApiOperation({ summary: 'External services health check' })
  @ApiResponse({ status: 200, description: 'External services are healthy' })
  @ApiResponse({
    status: 503,
    description: 'Some external services are unhealthy',
  })
  async externalHealth(): Promise<{
    status: 'healthy' | 'unhealthy' | 'degraded';
    responseTime: number;
    details?: Record<string, unknown>;
    error?: string;
  }> {
    return await this.healthCheckService.checkExternalServices();
  }

  @Get('metrics')
  @ApiOperation({ summary: 'System metrics' })
  @ApiResponse({ status: 200, description: 'System metrics' })
  async metrics(): Promise<{
    timestamp: string;
    uptime: number;
    memory: Record<string, number>;
    cpu: Record<string, number>;
    process: Record<string, string | number>;
    resilience: Record<string, unknown>;
    audit: Record<string, unknown>;
  }> {
    return await this.healthCheckService.getSystemMetrics();
  }
}
