import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CandidatesService } from './candidates.service';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Role } from '../../generated/prisma/enums';
import { CurrentUser } from '../common/decorators/current-user-decorator';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ActiveDeactiveCandidateDto } from './dto/active-deactive-candidate.dto';
import { CandidateDashboardDto } from './dto/candidate-dashboard.dto';
import { GetRecommendedJobDto } from './dto/get-recommended-job.dto';

@Controller('candidates')
export class CandidatesController {
  constructor(private readonly candidatesService: CandidatesService) {}

  @Get('profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CANDIDATE)
  getProfile(@CurrentUser() user: any) {
    return this.candidatesService.getProfile(user.userId);
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CANDIDATE)
  updateProfile(@CurrentUser() user: any, @Body() dto: UpdateProfileDto) {
    return this.candidatesService.updateProfile(user.userId, dto);
  }

  @Patch('active-deactive-candidate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CANDIDATE)
  activeDeactiveCandidate(
    @CurrentUser() user: any,
    @Body() data: ActiveDeactiveCandidateDto,
  ) {
    return this.candidatesService.activeDeactiveCandidate(user.userId, data);
  }

  @Get('dashboard')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CANDIDATE)
  async getDashboard(@CurrentUser() user: any): Promise<CandidateDashboardDto> {
    return this.candidatesService.getDashboard(user.userId);
  }

  @Get('job/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CANDIDATE)
  async getJob(@Param('id') id: string, @CurrentUser() user: any) {
    return this.candidatesService.getJob(id, user.userId);
  }

  @Get('recommended-jobs')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CANDIDATE)
  async getRecommendedJobs(
    @CurrentUser() user: any,
    @Query() query: GetRecommendedJobDto,
  ) {
    return this.candidatesService.getRecommendedJobs(user.userId, query);
  }
}
