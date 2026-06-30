import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SkillsService } from './skills.service';
import { CreateSkillsDto } from './dto/create-skill.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../../generated/prisma/enums';
import { UpdateSkillDto } from './dto/update-skill.dto';
import { ActiveDeactiveSkillDto } from './dto/active-deactive-skill.dto';

@Controller('skills')
export class SkillsController {
  constructor(private readonly skillService: SkillsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async createBulk(@Body() data: CreateSkillsDto) {
    return this.skillService.createBulk(data);
  }

  @Patch()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async updateSkill(@Body() data: UpdateSkillDto) {
    return this.skillService.updateSkill(data);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async getSkills(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.skillService.getSkills(page, limit);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async getById(@Param('id') id: string) {
    return this.skillService.getById(id);
  }

  @Patch('active-deactive-skill')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async activeDeactiveSkill(@Body() data: ActiveDeactiveSkillDto) {
    return this.skillService.activeDeactiveSkill(data);
  }
}
