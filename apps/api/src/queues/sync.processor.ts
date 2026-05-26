import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OfflineSyncQueue, SyncStatus } from '../modules/sync/sync-queue.entity';

@Processor('sync')
@Injectable()
export class SyncProcessor extends WorkerHost {
  private readonly logger = new Logger(SyncProcessor.name);

  constructor(
    @InjectRepository(OfflineSyncQueue)
    private readonly syncRepository: Repository<OfflineSyncQueue>,
  ) {
    super();
  }

  async process(job: Job<{ syncId: string }>) {
    this.logger.log(`Processing sync job: ${job.id}`);

    try {
      const syncItem = await this.syncRepository.findOne({
        where: { id: job.data.syncId },
      });

      if (!syncItem) {
        this.logger.warn(`Sync item not found: ${job.data.syncId}`);
        return;
      }

      const { entity, action } = syncItem;

      this.logger.log(`Processing ${action} on ${entity}`);

      await this.syncRepository.update(syncItem.id, {
        status: SyncStatus.COMPLETED,
        processedAt: new Date(),
      });
    } catch (error) {
      this.logger.error(`Sync job failed: ${job.id}`, error);

      await this.syncRepository.update(job.data.syncId, {
        status: SyncStatus.FAILED,
        error: error instanceof Error ? error.message : 'Unknown error',
        retryCount: () => 'retry_count + 1',
      });

      throw error;
    }
  }
}
