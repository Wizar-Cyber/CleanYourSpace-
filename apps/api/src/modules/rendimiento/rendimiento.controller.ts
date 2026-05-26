import {
  Controller, Get, Post, Put, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RendimientoService } from './rendimiento.service';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../users/user.entity';
import { ScorePeriod } from './performance-score.entity';
import { CreateEvaluationDto, UpdateEvaluationDto } from '@corecon/types';

@Controller('rendimiento')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class RendimientoController {
  constructor(private readonly rendimientoService: RendimientoService) {}

  // ── RF-047: Attendance ──
  @Get('attendance/:contractorId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.SUPERVISOR, UserRole.CONTRACTOR)
  async getAttendance(
    @Param('contractorId') contractorId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: string,
  ) {
    if (role === UserRole.CONTRACTOR) contractorId = userId;
    return this.rendimientoService.getAttendanceMetrics(contractorId, from, to);
  }

  // ── RF-048: Punctuality ──
  @Get('punctuality/:contractorId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.SUPERVISOR, UserRole.CONTRACTOR)
  async getPunctuality(
    @Param('contractorId') contractorId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('threshold') threshold?: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: string,
  ) {
    if (role === UserRole.CONTRACTOR) contractorId = userId;
    return this.rendimientoService.getPunctualityMetrics(contractorId, from, to, threshold ? Number(threshold) : undefined);
  }

  // ── RF-049: Time per service type ──
  @Get('service-time/:contractorId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.SUPERVISOR, UserRole.CONTRACTOR)
  async getServiceTime(
    @Param('contractorId') contractorId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: string,
  ) {
    if (role === UserRole.CONTRACTOR) contractorId = userId;
    return this.rendimientoService.getServiceTimeMetrics(contractorId, from, to);
  }

  // ── RF-050: Quality score ──
  @Get('quality-score/:contractorId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.SUPERVISOR, UserRole.CONTRACTOR)
  async getQualityScore(
    @Param('contractorId') contractorId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: string,
  ) {
    if (role === UserRole.CONTRACTOR) contractorId = userId;
    return this.rendimientoService.getQualityScore(contractorId, from, to);
  }

  // ── RF-051: Incident history ──
  @Get('incidents/:contractorId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.SUPERVISOR, UserRole.CONTRACTOR)
  async getIncidents(
    @Param('contractorId') contractorId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: string,
  ) {
    if (role === UserRole.CONTRACTOR) contractorId = userId;
    return this.rendimientoService.getIncidentHistory(contractorId, Number(page), Number(limit));
  }

  // ── RF-052: Evaluations ──
  @Post('evaluations')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.SUPERVISOR)
  async createEvaluation(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateEvaluationDto,
  ) {
    return this.rendimientoService.createEvaluation(dto, userId);
  }

  @Get('evaluations')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.SUPERVISOR, UserRole.CONTRACTOR)
  async getEvaluations(
    @Query('contractorId') contractorId?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: string,
  ) {
    if (role === UserRole.CONTRACTOR) contractorId = userId;
    return this.rendimientoService.getEvaluations(contractorId, Number(page), Number(limit));
  }

  @Get('evaluations/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.SUPERVISOR)
  async getEvaluationById(@Param('id') id: string) {
    return this.rendimientoService.getEvaluationById(id);
  }

  @Put('evaluations/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.SUPERVISOR)
  async updateEvaluation(
    @Param('id') id: string,
    @Body() dto: UpdateEvaluationDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.rendimientoService.updateEvaluation(id, dto, userId);
  }

  // ── RF-053: Individual Dashboard ──
  @Get('dashboard/:contractorId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.SUPERVISOR, UserRole.CONTRACTOR)
  async getDashboard(
    @Param('contractorId') contractorId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: string,
  ) {
    if (role === UserRole.CONTRACTOR) contractorId = userId;
    return this.rendimientoService.getIndividualDashboard(contractorId);
  }

  // ── My Dashboard (contractor self) ──
  @Get('my-dashboard')
  @Roles(UserRole.CONTRACTOR)
  async getMyDashboard(@CurrentUser('id') userId: string) {
    return this.rendimientoService.getIndividualDashboard(userId);
  }

  // ── RF-054: Comparative Report ──
  @Post('comparative')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER)
  async getComparativeReport(
    @Body() body: { contractorIds: string[]; from: string; to: string },
  ) {
    return this.rendimientoService.getComparativeReport(body.contractorIds, body.from, body.to);
  }

  // ── Score History ──
  @Get('scores/:contractorId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.SUPERVISOR, UserRole.CONTRACTOR)
  async getScoreHistory(
    @Param('contractorId') contractorId: string,
    @Query('period') period = 'monthly',
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: string,
  ) {
    if (role === UserRole.CONTRACTOR) contractorId = userId;
    return this.rendimientoService.getScoreHistory(contractorId, period, from, to, Number(page), Number(limit));
  }

  // ── Compute & Store Score ──
  @Post('compute-score/:contractorId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER)
  async computeScore(
    @Param('contractorId') contractorId: string,
    @Body() body: { period: ScorePeriod },
  ) {
    return this.rendimientoService.computeAndStoreScore(contractorId, body.period);
  }
}
