import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { LogRocketService } from './logrocket.service';

@Injectable()
export class LogRocketMiddleware implements NestMiddleware {
  constructor(private readonly logRocketService: LogRocketService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    if (!this.logRocketService.isReady()) {
      return next();
    }

    const startTime = Date.now();
    const { method, url, headers, body } = req;

    // Track API request start
    this.logRocketService.track('API Request Started', {
      method,
      url,
      userAgent: headers['user-agent'],
      contentType: headers['content-type'],
      hasBody: !!body && Object.keys(body).length > 0,
    });

    // Add request tags
    this.logRocketService.addTag('api.method', method);
    this.logRocketService.addTag('api.endpoint', url);

    // Use res.on('finish') to capture response completion
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const statusCode = res.statusCode;

      // Track API request completion
      try {
        this.logRocketService.track('API Request Completed', {
          method,
          url,
          statusCode,
          duration,
          success: statusCode < 400,
          userAgent: headers['user-agent'],
        });

        // Add response tags
        this.logRocketService.addTag('api.status', statusCode.toString());
        this.logRocketService.addTag('api.success', statusCode < 400 ? 'true' : 'false');

        // Log slow requests
        if (duration > 1000) {
          this.logRocketService.log(`Slow API request: ${method} ${url}`, 'warn', {
            duration,
            statusCode,
          });
        }

        // Log errors
        if (statusCode >= 400) {
          this.logRocketService.log(`API error: ${method} ${url}`, 'error', {
            statusCode,
            duration,
          });
        }
      } catch (error) {
        console.warn('LogRocket middleware error:', error);
      }
    });

    next();
  }
}
