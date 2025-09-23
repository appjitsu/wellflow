/**
 * Simple Logger Utility for Queue UI Dashboard
 * 
 * Provides structured logging with different levels.
 * Designed for production deployment with proper log formatting.
 */

export interface LogEntry {
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  timestamp: string;
  service: string;
  data?: any;
}

class Logger {
  private serviceName = 'queue-ui';

  private formatLog(level: LogEntry['level'], message: string, data?: any): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      service: this.serviceName,
      data,
    };
  }

  private output(logEntry: LogEntry) {
    const logString = JSON.stringify(logEntry);
    
    switch (logEntry.level) {
      case 'error':
        console.error(logString);
        break;
      case 'warn':
        console.warn(logString);
        break;
      case 'debug':
        if (process.env.NODE_ENV === 'development') {
          console.debug(logString);
        }
        break;
      default:
        console.log(logString);
    }
  }

  info(message: string, data?: any) {
    this.output(this.formatLog('info', message, data));
  }

  warn(message: string, data?: any) {
    this.output(this.formatLog('warn', message, data));
  }

  error(message: string, data?: any) {
    this.output(this.formatLog('error', message, data));
  }

  debug(message: string, data?: any) {
    this.output(this.formatLog('debug', message, data));
  }
}

export const logger = new Logger();
