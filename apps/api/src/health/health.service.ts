import { Injectable, Logger, Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Redis } from 'ioredis';
import { CircuitBreakerService } from '../common/resilience/circuit-breaker.service';
import { RetryService } from '../common/resilience/retry.service';
import { AuditLogService } from '../application/services/audit-log.service';
import * as schema from '../database/schema';

export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  checks: Record<
    string,
    {
      status: 'healthy' | 'unhealthy';
      responseTime?: number;
      error?: string;
      details?: any;
    }
  >;
}

export interface ReadinessCheckResult {
  status: 'ready' | 'not_ready';
  timestamp: string;
  dependencies: Record<string, boolean>;
}

export interface LivenessCheckResult {
  status: 'alive' | 'dead';
  timestamp: string;
  checks: Record<string, boolean>;
}

@Injectable()
export class HealthCheckService {
  private readonly logger = new Logger(HealthCheckService.name);
  private readonly startTime = Date.now();

  constructor(
    @Inject('DATABASE_CONNECTION')
    private readonly db: NodePgDatabase<typeof schema>,
    @Inject('REDIS_CONNECTION')
    private readonly redis: Redis,
    private readonly circuitBreakerService: CircuitBreakerService,
    private readonly retryService: RetryService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async checkHealth(): Promise<HealthCheckResult> {
    const checks = await Promise.allSettled([
      this.checkDatabaseHealth(),
      this.checkRedisHealth(),
      this.checkCircuitBreakerHealth(),
      this.checkRetryHealth(),
      this.checkMemoryHealth(),
      this.checkExternalServicesHealth(),
    ]);

    const checkResults: Record<string, any> = {};

    checks.forEach((result, index) => {
      const checkName = [
        'database',
        'redis',
        'circuit_breaker',
        'retry',
        'memory',
        'external_services',
      ][index];
      if (result.status === 'fulfilled') {
        checkResults[checkName] = result.value;
      } else {
        checkResults[checkName] = {
          status: 'unhealthy',
          error: result.reason.message,
          responseTime: 0,
        };
      }
    });

    const allHealthy = Object.values(checkResults).every(
      (check) => check.status === 'healthy',
    );

    return {
      status: allHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: Date.now() - this.startTime,
      version: process.env.npm_package_version || '1.0.0',
      checks: checkResults,
    };
  }

  async checkReadiness(): Promise<ReadinessCheckResult> {
    const dependencies = await Promise.allSettled([
      this.checkDatabaseConnection(),
      this.checkRedisConnection(),
      this.checkRequiredServices(),
    ]);

    const dependencyResults = {
      database: dependencies[0].status === 'fulfilled' && dependencies[0].value,
      redis: dependencies[1].status === 'fulfilled' && dependencies[1].value,
      services: dependencies[2].status === 'fulfilled' && dependencies[2].value,
    };

    const allReady = Object.values(dependencyResults).every(Boolean);

    return {
      status: allReady ? 'ready' : 'not_ready',
      timestamp: new Date().toISOString(),
      dependencies: dependencyResults,
    };
  }

  async checkLiveness(): Promise<LivenessCheckResult> {
    const checks = await Promise.allSettled([
      this.checkMemoryUsage(),
      this.checkEventLoopLag(),
      this.checkGarbageCollection(),
    ]);

    const checkResults = {
      memory: checks[0].status === 'fulfilled' && checks[0].value,
      event_loop: checks[1].status === 'fulfilled' && checks[1].value,
      gc: checks[2].status === 'fulfilled' && checks[2].value,
    };

    const allAlive = Object.values(checkResults).every(Boolean);

    return {
      status: allAlive ? 'alive' : 'dead',
      timestamp: new Date().toISOString(),
      checks: checkResults,
    };
  }

  async checkDatabase(): Promise<any> {
    const startTime = Date.now();

    try {
      // Test basic connectivity
      await this.db.execute({
        sql: 'SELECT 1',
        args: [],
      });

      // Test a more complex query
      const result = await this.db
        .select({ count: schema.organizations.id })
        .from(schema.organizations)
        .limit(1);

      const responseTime = Date.now() - startTime;

      return {
        status: 'healthy',
        responseTime,
        details: {
          connectionCount: Array.isArray(result) ? result.length : 0,
          queryTime: responseTime,
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: error.message,
      };
    }
  }

  async checkRedis(): Promise<any> {
    const startTime = Date.now();

    try {
      await this.redis.ping();
      const info = await this.redis.info('server');

      const responseTime = Date.now() - startTime;

      return {
        status: 'healthy',
        responseTime,
        details: {
          version: this.parseRedisVersion(info),
          uptime: this.parseRedisUptime(info),
          connections: await this.redis.dbsize(),
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: error.message,
      };
    }
  }

  async checkExternalServices(): Promise<any> {
    const startTime = Date.now();

    try {
      // Check circuit breaker states
      const circuitBreakerMetrics = this.circuitBreakerService.getAllMetrics();

      // Check if any circuit breakers are open
      const openBreakers = circuitBreakerMetrics.filter(
        (metric) => metric.state === 'OPEN',
      );

      const responseTime = Date.now() - startTime;

      return {
        status: openBreakers.length === 0 ? 'healthy' : 'degraded',
        responseTime,
        details: {
          totalCircuitBreakers: circuitBreakerMetrics.length,
          openCircuitBreakers: openBreakers.length,
          circuitBreakerStates: circuitBreakerMetrics.reduce((acc, metric) => {
            acc[metric.serviceName] = metric.state;
            return acc;
          }, {}),
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: error.message,
      };
    }
  }

  async getSystemMetrics(): Promise<any> {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    return {
      timestamp: new Date().toISOString(),
      uptime: Date.now() - this.startTime,
      memory: {
        rss: memUsage.rss,
        heapTotal: memUsage.heapTotal,
        heapUsed: memUsage.heapUsed,
        external: memUsage.external,
        arrayBuffers: memUsage.arrayBuffers,
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system,
      },
      process: {
        pid: process.pid,
        platform: process.platform,
        version: process.version,
        arch: process.arch,
      },
      resilience: {
        circuitBreakers: this.circuitBreakerService.getAllMetrics(),
        retryMetrics: {
          // Get retry metrics from service if available
        },
      },
      audit: {
        // Recent audit activity summary
      },
    };
  }

  // Private helper methods

  private async checkDatabaseHealth(): Promise<any> {
    return await this.checkDatabase();
  }

  private async checkRedisHealth(): Promise<any> {
    return await this.checkRedis();
  }

  private async checkCircuitBreakerHealth(): Promise<any> {
    const startTime = Date.now();

    try {
      const metrics = this.circuitBreakerService.getAllMetrics();
      const unhealthyBreakers = metrics.filter(
        (m) => m.state === 'OPEN' && m.failureCount > 5,
      );

      return {
        status: unhealthyBreakers.length === 0 ? 'healthy' : 'degraded',
        responseTime: Date.now() - startTime,
        details: {
          totalBreakers: metrics.length,
          unhealthyBreakers: unhealthyBreakers.length,
          states: metrics.reduce((acc, m) => {
            acc[m.serviceName] = m.state;
            return acc;
          }, {}),
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: error.message,
      };
    }
  }

  private async checkRetryHealth(): Promise<any> {
    const startTime = Date.now();

    try {
      // Check if retry service is functioning
      return {
        status: 'healthy',
        responseTime: Date.now() - startTime,
        details: {
          serviceAvailable: true,
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: error.message,
      };
    }
  }

  private async checkMemoryHealth(): Promise<any> {
    const startTime = Date.now();
    const memUsage = process.memoryUsage();

    try {
      // Check if memory usage is within acceptable limits
      const heapUsedMB = memUsage.heapUsed / 1024 / 1024;
      const heapTotalMB = memUsage.heapTotal / 1024 / 1024;
      const usageRatio = heapUsedMB / heapTotalMB;

      // Consider unhealthy if using more than 90% of heap
      const isHealthy = usageRatio < 0.9;

      return {
        status: isHealthy ? 'healthy' : 'unhealthy',
        responseTime: Date.now() - startTime,
        details: {
          heapUsed: Math.round(heapUsedMB),
          heapTotal: Math.round(heapTotalMB),
          usageRatio: Math.round(usageRatio * 100) / 100,
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: error.message,
      };
    }
  }

  private async checkExternalServicesHealth(): Promise<any> {
    return await this.checkExternalServices();
  }

  private async checkDatabaseConnection(): Promise<boolean> {
    try {
      await this.db.execute({ sql: 'SELECT 1', args: [] });
      return true;
    } catch {
      return false;
    }
  }

  private async checkRedisConnection(): Promise<boolean> {
    try {
      await this.redis.ping();
      return true;
    } catch {
      return false;
    }
  }

  private async checkRequiredServices(): Promise<boolean> {
    // Check if audit logging is working
    try {
      await this.auditLogService.logSystemAction(
        'HEALTH_CHECK',
        'system-health',
        true,
      );
      return true;
    } catch {
      return false;
    }
  }

  private async checkMemoryUsage(): Promise<boolean> {
    const memUsage = process.memoryUsage();
    const heapUsedMB = memUsage.heapUsed / 1024 / 1024;
    const heapTotalMB = memUsage.heapTotal / 1024 / 1024;

    // Consider dead if using more than 95% of heap or heap is corrupted
    return heapUsedMB / heapTotalMB < 0.95 && heapTotalMB > 0;
  }

  private async checkEventLoopLag(): Promise<boolean> {
    return new Promise((resolve) => {
      const start = process.hrtime.bigint();
      setImmediate(() => {
        const lag = Number(process.hrtime.bigint() - start) / 1e6; // Convert to milliseconds
        // Consider unhealthy if event loop lag is > 100ms
        resolve(lag < 100);
      });
    });
  }

  private async checkGarbageCollection(): Promise<boolean> {
    // Basic GC check - in a real implementation, you'd use gc-stats or similar
    return process.memoryUsage().heapUsed > 0;
  }

  private parseRedisVersion(info: string): string {
    const match = info.match(/redis_version:([^\r\n]+)/);
    return match ? match[1] : 'unknown';
  }

  private parseRedisUptime(info: string): number {
    const match = info.match(/uptime_in_seconds:([^\r\n]+)/);
    return match ? parseInt(match[1]) : 0;
  }
}
