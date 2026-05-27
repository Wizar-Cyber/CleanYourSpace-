import { LoggerService } from '@nestjs/common';

const LOG_LEVELS = ['verbose', 'debug', 'info', 'warn', 'error'] as const;
type LogLevel = (typeof LOG_LEVELS)[number];

const LOG_LEVEL_RANK: Record<LogLevel, number> = {
  verbose: 0,
  debug: 1,
  info: 2,
  warn: 3,
  error: 4,
};

function shouldLog(level: LogLevel, minLevel: LogLevel): boolean {
  return LOG_LEVEL_RANK[level] >= LOG_LEVEL_RANK[minLevel];
}

export class JsonLogger implements LoggerService {
  private readonly minLevel: LogLevel;

  constructor(minLevel?: LogLevel) {
    const envLevel = process.env.LOG_LEVEL?.toLowerCase() as LogLevel | undefined;
    this.minLevel = minLevel || envLevel || 'info';
  }

  formatMessage(message: string, level: string, context?: string, meta?: Record<string, unknown>): string {
    const log: Record<string, unknown> = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: context || 'Application',
      pid: process.pid,
      ...meta,
    };

    return JSON.stringify(log);
  }

  log(message: string, context?: string) {
    if (shouldLog('info', this.minLevel)) {
      process.stdout.write(this.formatMessage(message, 'info', context) + '\n');
    }
  }

  warn(message: string, context?: string) {
    if (shouldLog('warn', this.minLevel)) {
      process.stdout.write(this.formatMessage(message, 'warn', context) + '\n');
    }
  }

  error(message: string, trace?: string, context?: string) {
    if (shouldLog('error', this.minLevel)) {
      process.stderr.write(this.formatMessage(message, 'error', context, trace ? { trace } : undefined) + '\n');
    }
  }

  debug(message: string, context?: string) {
    if (shouldLog('debug', this.minLevel)) {
      process.stdout.write(this.formatMessage(message, 'debug', context) + '\n');
    }
  }

  verbose(message: string, context?: string) {
    if (shouldLog('verbose', this.minLevel)) {
      process.stdout.write(this.formatMessage(message, 'verbose', context) + '\n');
    }
  }
}

