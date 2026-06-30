import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateJobDto } from './dto/create-job.dto';
import { JobResponseDto } from './dto/job-response.dto';
import { Job, Prisma, Role } from '../../generated/prisma/client';
import { GetJobsDto } from './dto/get-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { GetJobForUser } from './dto/get-job-for-user.dto';
import { JobTextBuilderService } from './job-text-builder.service';
import { EmbeddingsService } from '../embeddings/embeddings.service';
import { HashService } from '../common/hash/hash.service';
import { BulkImportResponseDto } from './dto/bulk-import-response.dto';
import { createReadStream } from 'fs';
import { unlink } from 'fs/promises';
import csv from 'csv-parser';
import { extname } from 'path';
import * as XLSX from 'xlsx';

@Injectable()
export class JobsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jobTextBuilderService: JobTextBuilderService,
    private readonly embeddingsService: EmbeddingsService,
    private readonly hashService: HashService,
  ) {}

  private mapJobResponse(job: Job): JobResponseDto {
    return {
      id: job.id,
      title: job.title,
      description: job.description,
      location: job.location,

      minExperience: job.minExperience,
      maxExperience: job.maxExperience,

      isPublished: job.isPublished,

      expiresAt: job.expiresAt,

      recruiterId: job.recruiterId,

      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
    };
  }

  async create(
    recruiterId: string,
    role: Role,
    dto: CreateJobDto,
  ): Promise<JobResponseDto> {
    if (
      dto.minExperience !== undefined &&
      dto.maxExperience !== undefined &&
      dto.maxExperience < dto.minExperience
    ) {
      throw new BadRequestException(
        'maxExperience must be greater than or equal to minExperience',
      );
    }
    if (role !== Role.RECRUITER) {
      throw new ForbiddenException('No access to add job');
    }

    const recruiter = await this.prisma.user.findUnique({
      where: {
        id: recruiterId,
      },
    });

    if (!recruiter) {
      throw new BadRequestException('Recruiter not found');
    }

    const job = await this.createJob(recruiterId, dto);
    return this.mapJobResponse(job);
  }

  async update(
    userId: string,
    role: Role,
    dto: UpdateJobDto,
  ): Promise<JobResponseDto> {
    const job = await this.prisma.job.findUnique({
      where: {
        id: dto.id,
      },
    });

    if (!job) {
      throw new BadRequestException('Job not found');
    }

    if (role === Role.RECRUITER && job.recruiterId !== userId) {
      throw new ForbiddenException('You can only update your own jobs');
    }

    const updatedJob = await this.prisma.job.update({
      where: {
        id: dto.id,
      },
      data: {
        ...dto,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
      },
    });
    // add extracted text
    const text = await this.regenerateJobText(job.id);
    if (!text) {
      throw new BadRequestException('Job extracted text not found');
    }

    // generate embedding
    const embedding = await this.embeddingsService.createEmbedding(text);

    // save embedding in db
    await this.embeddingsService.saveEmbedding('job', job.id, embedding);

    return this.mapJobResponse(updatedJob);
  }

  async getById(id: string): Promise<JobResponseDto> {
    const job = await this.prisma.job.findUnique({
      where: {
        id,
      },
    });

    if (!job) {
      throw new BadRequestException('Job not found');
    }

    return this.mapJobResponse(job);
  }

  async getAll(query: GetJobsDto) {
    const page = query.page;
    const limit = query.limit;

    const where: Prisma.JobWhereInput = {};

    if (query.search) {
      where.OR = [
        {
          title: {
            contains: query.search,
            mode: 'insensitive',
          },
        },
        {
          description: {
            contains: query.search,
            mode: 'insensitive',
          },
        },
      ];
    }

    const [jobs, total] = await this.prisma.$transaction([
      this.prisma.job.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),

      this.prisma.job.count({
        where,
      }),
    ]);

    return {
      data: jobs.map((job) => this.mapJobResponse(job)),

      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updatePublishedFlag(
    id: string,
    userId: string,
    role: Role,
    isPublished: boolean,
  ) {
    const job = await this.prisma.job.findUnique({
      where: {
        id,
      },
    });

    if (!job) {
      throw new BadRequestException('Job not found');
    }

    if (role === Role.RECRUITER && job.recruiterId !== userId) {
      throw new ForbiddenException('You can only manage your own jobs');
    }

    const updatedJob = await this.prisma.job.update({
      where: {
        id,
      },
      data: {
        isPublished,
      },
    });

    return this.mapJobResponse(updatedJob);
  }

  async getJobsForUser(userId: string, query: GetJobForUser) {
    const page = query.page!;
    const limit = query.limit!;

    const where: Prisma.JobWhereInput = {
      recruiterId: userId,
    };

    if (query.search) {
      where.OR = [
        {
          title: {
            contains: query.search,
            mode: 'insensitive',
          },
        },
        {
          description: {
            contains: query.search,
            mode: 'insensitive',
          },
        },
      ];
    }
    const [jobs, total] = await this.prisma.$transaction([
      this.prisma.job.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),

      this.prisma.job.count({
        where,
      }),
    ]);

    return {
      data: jobs.map((job) => this.mapJobResponse(job)),

      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async regenerateJobText(jobId: string): Promise<string | void> {
    const job = await this.prisma.job.findUnique({
      where: {
        id: jobId,
      },
      include: {
        skills: {
          include: {
            skill: true,
          },
        },
      },
    });

    if (!job) {
      return;
    }

    const skillNames = job.skills.map((jobSkill) => jobSkill.skill.name);

    const extractedText = this.jobTextBuilderService.build(
      job.title,
      job.description,
      skillNames,
    );

    const hash = this.hashService.generate(extractedText);

    await this.prisma.job.update({
      where: {
        id: jobId,
      },
      data: {
        extractedText,
        textHash: hash,
      },
    });
    return extractedText;
  }

  async bulkImport(
    userId: string,
    file: Express.Multer.File,
  ): Promise<BulkImportResponseDto> {
    if (!file) {
      throw new BadRequestException('CSV file is required');
    }

    const recruiter = await this.prisma.user.findUnique({
      where: {
        id: userId,
        role: Role.RECRUITER,
      },
    });

    if (!recruiter) {
      throw new NotFoundException('Recruiter not found');
    }

    const rows = await this.parseFile(file);

    let imported = 0;
    const errors: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];

      try {
        const dto: CreateJobDto = {
          title: row.title,
          description: row.description,
          location: row.location,
          minExperience: Number(row.minExperience),
          maxExperience: Number(row.maxExperience),
          expiresAt: row.expiresAt,
        };

        await this.createJob(recruiter.id, dto);

        imported++;
      } catch (error) {
        errors.push(
          `Row ${i + 1}: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
        );
      }
    }

    await unlink(file.path).catch(() => {});

    return {
      total: rows.length,
      imported,
      failed: rows.length - imported,
      errors,
    };
  }

  // helper functions
  private async createJob(recruiterId: string, dto: CreateJobDto) {
    const job = await this.prisma.job.create({
      data: {
        title: dto.title,
        description: dto.description,
        location: dto.location,
        minExperience: dto.minExperience,
        maxExperience: dto.maxExperience,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        recruiterId,
      },
    });
    // add extracted text
    const text = await this.regenerateJobText(job.id);
    if (!text) {
      throw new BadRequestException('Job extracted text not found');
    }

    // generate embedding
    const embedding = await this.embeddingsService.createEmbedding(text);

    // save embedding in db
    await this.embeddingsService.saveEmbedding('job', job.id, embedding);

    return job;
  }

  private async parseFile(
    file: Express.Multer.File,
  ): Promise<Record<string, any>[]> {
    const extension = extname(file.originalname).toLowerCase();

    if (extension === '.csv') {
      return this.parseCsv(file.path);
    }

    if (extension === '.xlsx' || extension === '.xls') {
      return this.parseExcel(file.path);
    }

    throw new BadRequestException('Unsupported file type');
  }

  private parseCsv(path: string): Promise<Record<string, any>[]> {
    return new Promise((resolve, reject) => {
      const rows: Record<string, any>[] = [];

      createReadStream(path)
        .pipe(csv())
        .on('data', (row) => rows.push(row))
        .on('end', () => resolve(rows))
        .on('error', reject);
    });
  }

  private parseExcel(path: string): Record<string, any>[] {
    const workbook = XLSX.readFile(path);
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];

    return XLSX.utils.sheet_to_json(firstSheet);
  }
}
