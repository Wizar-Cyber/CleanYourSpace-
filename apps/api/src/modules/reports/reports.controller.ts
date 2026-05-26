import {
  Controller, Get, Post, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ReportsService } from './reports.service';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../users/user.entity';
import { GenerateReportDto } from '@corecon/types';

@Controller('reports')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  findAll(@Query('page') page = 1, @Query('limit') limit = 20) {
    return this.reportsService.findAll(page, limit);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.reportsService.findById(id);
  }

  @Post('generate')
  generate(@Body() dto: GenerateReportDto, @CurrentUser('id') userId: string) {
    return this.reportsService.generate(dto, userId);
  }

  @Post('daily')
  async generateDaily(@Body() dto: any, @CurrentUser('id') userId: string) {
    return this.reportsService.generateDaily({ ...dto, generatedBy: userId });
  }

  @Post('weekly')
  async generateWeekly(@Body('from') from: string, @Body('to') to: string) {
    return this.reportsService.generateWeekly(new Date(from), new Date(to));
  }

  @Post('payroll')
  async generatePayroll(@Body() dto: { contractorId?: string; from: string; to: string }) {
    return this.reportsService.generatePayroll(
      new Date(dto.from), new Date(dto.to), dto.contractorId,
    );
  }

  @Post('client/:clientId')
  async generateClientReport(
    @Param('clientId') clientId: string,
    @Body() dto: { from: string; to: string },
  ) {
    return this.reportsService.generateClientReport(
      clientId, new Date(dto.from), new Date(dto.to),
    );
  }

  @Post('incidents')
  async generateIncidentReport(
    @Body('from') from: string, @Body('to') to: string,
  ) {
    return this.reportsService.generateIncidentReport(
      new Date(from), new Date(to),
    );
  }
}