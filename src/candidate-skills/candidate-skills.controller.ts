import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { CandidateSkillsService } from './candidate-skills.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../../generated/prisma/enums';
import { UpsertCandidateSkillsDto } from './dto/upsert-candidate-skills.dto';
import { CurrentUser } from '../common/decorators/current-user-decorator';

@Controller('candidate-skills')
export class CandidateSkillsController {
  constructor(private readonly candidateSkillService: CandidateSkillsService) {}

  @Patch('update-skills')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CANDIDATE)
  async upsertSkills(
    @CurrentUser() user,
    @Body() data: UpsertCandidateSkillsDto,
  ) {
    return this.candidateSkillService.upsertSkills(user.userId, data);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CANDIDATE)
  async getSkills() {
    return this.candidateSkillService.getSkills();
  }

  @Get('skills')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CANDIDATE)
  async getSkillsForUser(@CurrentUser() user) {
    return this.candidateSkillService.getSkillsForUser(user.userId);
  }
}
