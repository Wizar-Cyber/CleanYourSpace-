import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AsyncContextService } from '../logger/async-context.service';

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  constructor(private readonly asyncContext: AsyncContextService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const correlationId = (req.headers['x-correlation-id'] as string) || uuidv4();
    const start = Date.now();
    (req as any)['correlationId'] = correlationId;
    res.setHeader('X-Correlation-Id', correlationId);

    const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip;
    const userAgent = (req.headers['user-agent'] as string) || undefined;

    res.on('finish', () => {
      const duration = Date.now() - start;
      if (req.method !== 'OPTIONS') {
        this.logger.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms [${correlationId}]`);
      }
    });

    this.asyncContext.run({ correlationId, ipAddress, userAgent }, () => next());
  }
}

