import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertCandidateSkillsDto } from './dto/upsert-candidate-skills.dto';

@Injectable()
export class CandidateSkillsService {
  constructor(private readonly prisma: PrismaService) {}

  async upsertSkills(userId: string, dto: UpsertCandidateSkillsDto) {
    const candidate = await this.prisma.candidate.findUnique({
      where: {
        userId,
      },
    });

    if (!candidate) {
      throw new NotFoundException('Candidate not found');
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

    if (skills.length !== uniqueSkillIds.length) {
      throw new BadRequestException(
        'One or more skills are invalid or inactive',
      );
    }

    // Get current candidate skills
    const existingSkills = await this.prisma.candidateSkill.findMany({
      where: {
        candidateId: candidate.id,
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
      return this.getSkillsForUser(userId);
    }

    await this.prisma.$transaction(async (tx) => {
      if (skillIdsToRemove.length) {
        await tx.candidateSkill.deleteMany({
          where: {
            candidateId: candidate.id,
            skillId: {
              in: skillIdsToRemove,
            },
          },
        });
      }

      if (skillIdsToAdd.length) {
        await tx.candidateSkill.createMany({
          data: skillIdsToAdd.map((skillId) => ({
            candidateId: candidate.id,
            skillId,
          })),
        });
      }
    });

    return this.getSkillsForUser(userId);
  }

  async getSkillsForUser(userId: string) {
    const candidate = await this.prisma.candidate.findUnique({
      where: {
        userId,
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

    if (!candidate) {
      throw new NotFoundException('Candidate not found');
    }

    return candidate.skills.map((candidateSkill) => candidateSkill.skill);
  }

  async getSkills() {
    return this.prisma.skill.findMany({
      where: {
        isActive: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
