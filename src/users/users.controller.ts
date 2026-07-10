import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../../generated/prisma/enums';
import { ActivateDeactivateDto } from './dto/activate-deactivate.dto';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { CurrentUser } from '../common/decorators/current-user-decorator';
import { AdminDashboardDto } from './dto/admin-dashboard.dto';
import { GetRecruiterDto } from './dto/get-recruiters.dto';
import { GetCandidateDto } from './dto/get-candidate.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly userService: UsersService) {}

  @Get('recruiters')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async getRecruiters(@Query() query: GetRecruiterDto) {
    return this.userService.getRecruiters(query);
  }

  @Get('recruiter/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async getById(@Param('id') id: string) {
    return this.userService.getRecruiter(id);
  }

  @Patch('active-deactive-user')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async activeDeactiveUser(@Body() data: ActivateDeactivateDto) {
    return this.userService.activateDeactivateUser(data);
  }

  @Get('candidates')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async getAllCandidates(@Query() query: GetCandidateDto) {
    return this.userService.getAllCandidates(query);
  }

  @Get('candidate/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async getCandidate(@Param('id') id: string) {
    return this.userService.getCandidate(id);
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.RECRUITER)
  async updateUserProfile(
    @CurrentUser() user: any,
    @Body() data: UpdateUserProfileDto,
  ) {
    return this.userService.updateUserProfile(user.userId, data);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.RECRUITER)
  async getUserrProfile(@CurrentUser() user: any) {
    return this.userService.getUserProfile(user.userId);
  }

  @Get('admin/dashboard')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async getDashboard(): Promise<AdminDashboardDto> {
    return this.userService.adminDashboard();
  }
}
