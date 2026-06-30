import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../../generated/prisma/enums';
import { UpsertJobSkillsDto } from './dto/upsert-job-skills.dto';
import { JobSkillsService } from './job-skills.service';

@Controller('job-skills')
export class JobSkillsController {
  constructor(private readonly jobSkillService: JobSkillsService) {}

  @Patch('update-skills')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.RECRUITER)
  async upsertSkills(@Body() data: UpsertJobSkillsDto) {
    return this.jobSkillService.upsertSkills(data);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.RECRUITER)
  async getSkills() {
    return this.jobSkillService.getSkills();
  }

  @Get('skills/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.RECRUITER)
  async getSkillsForJob(@Param('id') id: string) {
    return this.jobSkillService.getSkillsForJob(id);
  }
}
