import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { CandidatesService } from './candidates.service';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Role } from '../../generated/prisma/enums';
import { CurrentUser } from '../common/decorators/current-user-decorator';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ActiveDeactiveCandidateDto } from './dto/active-deactive-candidate.dto';

@Controller('candidates')
export class CandidatesController {
  constructor(private readonly candidatesService: CandidatesService) {}

  @Get('profile')
  getProfile(@CurrentUser() user) {
    return this.candidatesService.getProfile(user.userId);
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CANDIDATE)
  updateProfile(@CurrentUser() user, @Body() dto: UpdateProfileDto) {
    return this.candidatesService.updateProfile(user.userId, dto);
  }

  @Patch('active-deactive-candidate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CANDIDATE)
  activeDeactiveCandidate(
    @CurrentUser() user,
    @Body() data: ActiveDeactiveCandidateDto,
  ) {
    return this.candidatesService.activeDeactiveCandidate(user.userId, data);
  }
}
