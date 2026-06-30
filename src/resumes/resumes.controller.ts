import {
  BadRequestException,
  Controller,
  Get,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ResumesService } from './resumes.service';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../../generated/prisma/enums';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { resumeUploadOptions } from './config/multer.config';
import { CurrentUser } from '../common/decorators/current-user-decorator';

@Controller('resumes')
export class ResumesController {
  constructor(private readonly resumesService: ResumesService) {}

  @Post()
  @Roles(Role.CANDIDATE)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @UseInterceptors(FileInterceptor('resume', resumeUploadOptions))
  uploadResume(@CurrentUser() user, @UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Resume file is required.');
    }

    const isPdfMime = file.mimetype === 'application/pdf';
    const isPdfExtension = file.originalname.toLowerCase().endsWith('.pdf');

    if (!isPdfMime || !isPdfExtension) {
      throw new BadRequestException('Only PDF files are allowed.');
    }

    return this.resumesService.uploadResume(user.userId, file);
  }

  @Get()
  @Roles(Role.CANDIDATE)
  @UseGuards(JwtAuthGuard, RolesGuard)
  getResume(@CurrentUser() user) {
    return this.resumesService.getResume(user.userId);
  }
}
