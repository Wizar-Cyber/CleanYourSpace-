import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';

export interface RequestContext {
  correlationId: string;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AsyncContextService implements OnModuleDestroy {
  private readonly storage = new AsyncLocalStorage<RequestContext>();

  run(context: RequestContext, callback: () => void) {
    this.storage.run(context, callback);
  }

  get(key: keyof RequestContext): string | undefined {
    return this.storage.getStore()?.[key];
  }

  get correlationId(): string | undefined {
    return this.get('correlationId');
  }

  onModuleDestroy() {
    this.storage.disable();
  }
}
