import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertJobSkillsDto } from './dto/upsert-job-skills.dto';
import { JobsService } from '../jobs/jobs.service';
import { EmbeddingsService } from '../embeddings/embeddings.service';

@Injectable()
export class JobSkillsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jobsService: JobsService,
    private readonly embeddingsService: EmbeddingsService,
  ) {}

  async upsertSkills(dto: UpsertJobSkillsDto) {
    const job = await this.prisma.job.findUnique({
      where: {
        id: dto.id,
      },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    // Remove duplicate skill ids from request
    const uniqueSkillIds = [...new Set(dto.skillIds)];

    // Validate skills exist and are active
    const skills = await this.prisma.skill.findMany({
      where: {
        id: {
          in: uniqueSkillIds,
        },
        isActive: true,
      },
      select: {
        id: true,
      },
    });

    // if (skills.length !== uniqueSkillIds.length) {
    //   throw new BadRequestException(
    //     'One or more skills are invalid or inactive',
    //   );
    // }

    // Get current candidate skills
    const existingSkills = await this.prisma.jobSkill.findMany({
      where: {
        jobId: job.id,
      },
      select: {
        skillId: true,
      },
    });

    const existingSkillIds = new Set(
      existingSkills.map((skill) => skill.skillId),
    );

    const incomingSkillIds = new Set(uniqueSkillIds);

    const skillIdsToAdd = uniqueSkillIds.filter(
      (skillId) => !existingSkillIds.has(skillId),
    );

    const skillIdsToRemove = [...existingSkillIds].filter(
      (skillId) => !incomingSkillIds.has(skillId),
    );

    // No changes
    if (skillIdsToAdd.length === 0 && skillIdsToRemove.length === 0) {
      return this.getSkillsForJob(job.id);
    }

    await this.prisma.$transaction(async (tx) => {
      if (skillIdsToRemove.length) {
        await tx.jobSkill.deleteMany({
          where: {
            jobId: job.id,
            skillId: {
              in: skillIdsToRemove,
            },
          },
        });
      }

      if (skillIdsToAdd.length) {
        await tx.jobSkill.createMany({
          data: skillIdsToAdd.map((skillId) => ({
            jobId: job.id,
            skillId,
          })),
        });
      }
    });
    // add extracted text
    const text = await this.jobsService.regenerateJobText(job.id);
    if (!text) {
      throw new BadRequestException('Job extracted text not found');
    }

    // generate embedding
    const embedding = await this.embeddingsService.createEmbedding(text);

    // save embedding in db
    await this.embeddingsService.saveEmbedding('job', job.id, embedding);

    return this.getSkillsForJob(job.id);
  }

  async getSkillsForJob(id: string) {
    const job = await this.prisma.job.findUnique({
      where: {
        id,
      },
      include: {
        skills: {
          include: {
            skill: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    return job.skills.map((jobSkill) => jobSkill.skill);
  }

  async getSkills() {
    return this.prisma.skill.findMany({
      select: {
        id: true,
        name: true,
        isActive: true,
      },
      orderBy: { name: 'asc' },
    });
  }
}
