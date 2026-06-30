import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { JobsService } from './jobs.service';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../../generated/prisma/enums';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user-decorator';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { GetJobsDto } from './dto/get-job.dto';
import { UpdatePublishedFlagDto } from './dto/update-published-flag.dto';
import { GetJobForUser } from './dto/get-job-for-user.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { jobImportUploadOptions } from '../common/upload/job-import-upload.options';

@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Post()
  @Roles(Role.RECRUITER)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async create(@CurrentUser() user, @Body() dto: CreateJobDto) {
    return this.jobsService.create(user.userId, user.role, dto);
  }

  @Patch()
  @Roles(Role.RECRUITER)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async update(@CurrentUser() user, @Body() dto: UpdateJobDto) {
    return this.jobsService.update(user.userId, user.role, dto);
  }

  @Get('user-jobs')
  @Roles(Role.RECRUITER)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async getJobsForUser(@CurrentUser() user, @Query() query: GetJobForUser) {
    return this.jobsService.getJobsForUser(user.userId, query);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.RECRUITER)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async getById(@Param('id') id: string) {
    return this.jobsService.getById(id);
  }

  @Get()
  @Roles(Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async getAll(@Query() query: GetJobsDto) {
    return this.jobsService.getAll(query);
  }

  @Patch('update-flag')
  @Roles(Role.ADMIN, Role.RECRUITER)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async updatePublishedFlag(
    @CurrentUser() user,
    @Body() data: UpdatePublishedFlagDto,
  ) {
    return this.jobsService.updatePublishedFlag(
      data.id,
      user.userId,
      user.role,
      data.isPublished,
    );
  }

  @Post('import')
  @Roles(Role.RECRUITER)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @UseInterceptors(FileInterceptor('file', jobImportUploadOptions))
  bulkImport(@CurrentUser() user, @UploadedFile() file: Express.Multer.File) {
    return this.jobsService.bulkImport(user.userId, file);
  }
}
