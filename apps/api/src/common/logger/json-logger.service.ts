import { LoggerService } from '@nestjs/common';

export class JsonLogger implements LoggerService {
  formatMessage(message: string, level: string, context?: string): string {
    const log: Record<string, unknown> = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: context || 'Application',
      pid: process.pid,
    };

    return JSON.stringify(log);
  }

  log(message: string, context?: string) {
    process.stdout.write(this.formatMessage(message, 'info', context) + '\n');
  }

  warn(message: string, context?: string) {
    process.stdout.write(this.formatMessage(message, 'warn', context) + '\n');
  }

  error(message: string, trace?: string, context?: string) {
    process.stderr.write(this.formatMessage(message, 'error', context) + '\n');
    if (trace) {
      process.stderr.write(trace + '\n');
    }
  }

  debug(message: string, context?: string) {
    process.stdout.write(this.formatMessage(message, 'debug', context) + '\n');
  }

  verbose(message: string, context?: string) {
    process.stdout.write(this.formatMessage(message, 'verbose', context) + '\n');
  }
}

