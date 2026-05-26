import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OfflineSyncQueue, SyncStatus, SyncEntityType } from './sync-queue.entity';

@Injectable()
export class SyncService {
  constructor(
    @InjectRepository(OfflineSyncQueue)
    private readonly syncRepository: Repository<OfflineSyncQueue>,
  ) {}

  async enqueue(items: Array<{
    userId: string;
    entity: string;
    entityId: string;
    action: string;
    payload: Record<string, unknown>;
  }>) {
    const entities = this.syncRepository.create(
      items.map((item) => ({
        userId: item.userId,
        entity: item.entity as SyncEntityType,
        entityId: item.entityId,
        action: item.action as any,
        payload: item.payload,
      })),
    );

    return this.syncRepository.save(entities);
  }

  async getPending(userId: string) {
    return this.syncRepository.find({
      where: { userId, status: SyncStatus.PENDING },
      order: { createdAt: 'ASC' },
    });
  }

  async getPendingCount(userId: string) {
    return this.syncRepository.count({
      where: { userId, status: SyncStatus.PENDING },
    });
  }

  async markProcessed(id: string) {
    await this.syncRepository.update(id, {
      status: SyncStatus.COMPLETED,
      processedAt: new Date(),
    });
  }

  async markFailed(id: string, error: string) {
    await this.syncRepository.update(id, {
      status: SyncStatus.FAILED,
      error,
      retryCount: () => 'retry_count + 1',
    });
  }

  async getSyncStatus(userId: string) {
    const pending = await this.getPendingCount(userId);
    const failed = await this.syncRepository.count({
      where: { userId, status: SyncStatus.FAILED },
    });

    return {
      pending,
      failed,
      total: pending + failed,
      lastSync: await this.syncRepository.findOne({
        where: { userId, status: SyncStatus.COMPLETED },
        order: { processedAt: 'DESC' },
      }),
    };
  }
}
