import {
  Controller, Get, Post, Body, UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SyncService } from './sync.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('sync')
@UseGuards(AuthGuard('jwt'))
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Post('enqueue')
  enqueue(
    @CurrentUser('id') userId: string,
    @Body('items') items: Array<{
      entity: string;
      entityId: string;
      action: string;
      payload: Record<string, unknown>;
    }>,
  ) {
    const enriched = items.map((item) => ({ ...item, userId }));
    return this.syncService.enqueue(enriched);
  }

  @Get('pending')
  getPending(@CurrentUser('id') userId: string) {
    return this.syncService.getPending(userId);
  }

  @Get('status')
  getSyncStatus(@CurrentUser('id') userId: string) {
    return this.syncService.getSyncStatus(userId);
  }
}
