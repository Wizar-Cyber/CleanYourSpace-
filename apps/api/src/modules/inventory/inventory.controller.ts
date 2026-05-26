import {
  Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { InventoryService } from './inventory.service';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../users/user.entity';
import { CreateSupplyItemDto, UpdateSupplyItemDto, CreateInventoryTransactionDto } from '@corecon/types';

@Controller('inventory')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  // ── RF-076: Supply Catalog ──
  @Get('supplies')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER)
  async findAllSupplies(
    @Query('category') category?: string,
    @Query('lowStock') lowStock?: string,
    @Query('search') search?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.inventoryService.findAllSupplies({
      category,
      lowStock: lowStock === 'true',
      search,
      page: Number(page),
      limit: Number(limit),
    });
  }

  @Get('supplies/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER)
  async findSupplyById(@Param('id') id: string) {
    return this.inventoryService.findSupplyById(id);
  }

  @Post('supplies')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER)
  async createSupply(@Body() dto: CreateSupplyItemDto, @CurrentUser('id') userId: string) {
    return this.inventoryService.createSupply(dto, userId);
  }

  @Put('supplies/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER)
  async updateSupply(
    @Param('id') id: string,
    @Body() dto: UpdateSupplyItemDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.inventoryService.updateSupply(id, dto, userId);
  }

  @Delete('supplies/:id')
  @Roles(UserRole.SUPER_ADMIN)
  async removeSupply(@Param('id') id: string) {
    return this.inventoryService.removeSupply(id);
  }

  // ── RF-077: Stock Transactions ──
  @Get('transactions')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER)
  async findTransactions(
    @Query('supplyItemId') supplyItemId?: string,
    @Query('type') type?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.inventoryService.findTransactions({
      supplyItemId, type, from, to,
      page: Number(page), limit: Number(limit),
    });
  }

  @Post('transactions')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER)
  async createTransaction(
    @Body() dto: CreateInventoryTransactionDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.inventoryService.createTransaction(dto, userId);
  }

  // ── RF-078: Low Stock Alerts ──
  @Get('low-stock')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER)
  async getLowStock() {
    return this.inventoryService.getLowStockItems();
  }

  // ── RF-079: Consumption Report ──
  @Post('consumption-report')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER)
  async getConsumptionReport(
    @Body() body: { from: string; to: string; contractorId?: string; serviceId?: string; supplyItemId?: string },
  ) {
    return this.inventoryService.getConsumptionReport(body.from, body.to, {
      contractorId: body.contractorId,
      serviceId: body.serviceId,
      supplyItemId: body.supplyItemId,
    });
  }
}
