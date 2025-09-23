import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

interface RequestWithUser extends Request {
  user?: { id?: string };
}

@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger(RequestLoggingMiddleware.name);

  use(req: RequestWithUser, res: Response, next: NextFunction): void {
    const { method, originalUrl, ip } = req;
    const userAgent = req.get('User-Agent') || '';
    const startTime = Date.now();

    // Extract user ID from JWT token if available
    const userId = req.user?.id || 'anonymous';

    // Log request
    this.logger.log(
      `REQUEST: ${method} ${originalUrl} - User: ${userId} - IP: ${ip} - UserAgent: ${userAgent}`,
    );

    // Listen for response finish event to log response
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const statusCode = res.statusCode;

      // Log response
      this.logger.log(
        `RESPONSE: ${method} ${originalUrl} - Status: ${statusCode} - Duration: ${duration}ms - User: ${userId}`,
      );
    });

    next();
  }
}
