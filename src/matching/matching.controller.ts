import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { MatchingService } from './matching.service';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../../generated/prisma/enums';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';

@Controller('jobs')
export class MatchingController {
  constructor(private readonly matchingService: MatchingService) {}

  @Get('matches/:jobId')
  @Roles(Role.ADMIN, Role.RECRUITER)
  @UseGuards(JwtAuthGuard, RolesGuard)
  getMatches(@Param('jobId') jobId: string) {
    return this.matchingService.getMatches(jobId);
  }
}
