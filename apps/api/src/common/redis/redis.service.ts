import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: RedisClientType | null = null;
  private connected = false;

  private readonly maxRetries = 10;

  constructor(private readonly configService: ConfigService) {
    const url = this.configService.get('REDIS_URL') || this.buildRedisUrl();
    try {
      this.client = createClient({
        url,
        socket: {
          reconnectStrategy: (retries: number, _cause: Error) => {
            if (retries > this.maxRetries) {
              this.logger.warn(`Redis: max retries (${this.maxRetries}) reached, giving up`);
              return false; // stop retrying
            }
            return Math.min(retries * 200, 2000); // exponential backoff up to 2s
          },
        },
      });
      this.client.on('error', (_err) => {
        this.connected = false;
      });
      this.client.on('ready', () => {
        this.connected = true;
      });
      this.client.connect().catch((err) => {
        this.connected = false;
        this.logger.warn(`Redis connection failed: ${err.message}`);
      });
    } catch (err: any) {
      this.connected = false;
      this.logger.warn(`Redis init failed: ${err.message}`);
    }
  }

  async blacklistToken(jti: string, ttlSeconds: number): Promise<void> {
    if (!this.connected || !this.client) {
      this.logger.warn('Redis unavailable, skipping blacklist');
      return;
    }
    try {
      await this.client.set(`bl:${jti}`, '1', { EX: ttlSeconds });
    } catch (err: any) {
      this.logger.warn(`Failed to blacklist token: ${err.message}`);
    }
  }

  async isBlacklisted(jti: string): Promise<boolean> {
    if (!this.connected || !this.client) {
      return false;
    }
    try {
      const result = await this.client.get(`bl:${jti}`);
      return result !== null;
    } catch {
      return false;
    }
  }

  private buildRedisUrl(): string {
    const host = this.configService.get('REDIS_HOST', 'localhost');
    const port = this.configService.get('REDIS_PORT', 6379);
    const password = this.configService.get('REDIS_PASSWORD');
    if (password) {
      return `redis://:${encodeURIComponent(password)}@${host}:${port}`;
    }
    return `redis://${host}:${port}`;
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit();
    }
  }
}
