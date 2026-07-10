import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSkillsDto } from './dto/create-skill.dto';
import { UpdateSkillDto } from './dto/update-skill.dto';
import { ActiveDeactiveSkillDto } from './dto/active-deactive-skill.dto';
import { GetSkillsDto } from './dto/get-skills.dto';
import { Prisma } from '../../generated/prisma/client';

@Injectable()
export class SkillsService {
  constructor(private readonly prisma: PrismaService) {}

  async createBulk(dto: CreateSkillsDto) {
    // Early return to prevent Prisma OR: [] crash
    if (!dto.skills || dto.skills.length === 0) {
      return { count: 0 };
    }

    // Deduplicate the incoming array first (e.g., ["Java", "java"] -> ["Java"])
    const uniqueIncomingSkills: string[] = [];
    const seenNames = new Set<string>();

    for (const skill of dto.skills) {
      const trimmed = skill.trim();
      const lower = trimmed.toLowerCase();
      if (!seenNames.has(lower)) {
        seenNames.add(lower);
        uniqueIncomingSkills.push(trimmed);
      }
    }

    // Fetch existing skills from DB
    const existingSkills = await this.prisma.skill.findMany({
      where: {
        OR: uniqueIncomingSkills.map((skill) => ({
          name: {
            equals: skill,
            mode: 'insensitive',
          },
        })),
      },
    });

    const existingNames = new Set(
      existingSkills.map((skill) => skill.name.toLowerCase()),
    );

    // Filter out skills that already exist in DB
    const skillsToCreate = uniqueIncomingSkills
      .filter((skill) => !existingNames.has(skill.toLowerCase()))
      .map((skill) => ({
        name: skill,
      }));

    // If everything already existed, don't run createMany!
    if (skillsToCreate.length === 0) {
      return { count: 0 };
    }

    const skills = await this.prisma.skill.createManyAndReturn({
      data: skillsToCreate,
      skipDuplicates: true,
    });

    return skills;
  }

  async updateSkill(data: UpdateSkillDto) {
    const existingSkill = await this.prisma.skill.findUnique({
      where: {
        id: data.id,
      },
    });

    if (!existingSkill) {
      throw new BadRequestException('Skill not found');
    }
    const skill = await this.prisma.skill.findFirst({
      where: {
        name: {
          equals: data.name.trim(),
          mode: 'insensitive',
        },
        id: {
          not: data.id,
        },
      },
    });

    if (skill) {
      throw new BadRequestException('Skill already exists!');
    }

    return this.prisma.skill.update({
      where: {
        id: data.id,
      },
      data: {
        name: data.name.trim(),
      },
    });
  }

  async getSkills(query: GetSkillsDto) {
    const { page, limit, search, sortBy, sortOrder } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.SkillWhereInput = {};

    if (search) {
      where.name = {
        contains: search,
        mode: 'insensitive',
      };
    }

    const [data, totalCount] = await this.prisma.$transaction([
      this.prisma.skill.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          {
            [sortBy ?? 'createdAt']: sortOrder ?? 'desc',
          },
          {
            id: 'desc',
          },
        ],
      }),

      this.prisma.skill.count({
        where,
      }),
    ]);

    return {
      data,
      meta: {
        totalCount,
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        limit,
      },
    };
  }

  async getById(id: string) {
    return this.prisma.skill.findUnique({
      where: {
        id,
      },
    });
  }

  async activeDeactiveSkill(data: ActiveDeactiveSkillDto) {
    const skill = await this.prisma.skill.findUnique({
      where: {
        id: data.id,
      },
    });
    if (!skill) {
      throw new BadRequestException('Skill not found');
    }
    if (skill.isActive !== data.isActive) {
      await this.prisma.skill.update({
        where: {
          id: data.id,
        },
        data: {
          isActive: data.isActive,
        },
      });
    }

    return {
      success: true,
      message: `Skill successfully ${data.isActive ? 'activated' : 'deactivated'}`,
    };
  }

  async deleteSkill(id: string) {
    const skill = await this.prisma.skill.findUnique({
      where: { id },
      include: {
        candidates: true,
        jobs: true,
      },
    });

    if (!skill) {
      throw new BadRequestException('Skill not found');
    }
    if (skill?.candidates.length || skill?.jobs.length) {
      throw new BadRequestException('Skill is assigned and cannot be deleted.');
    }
    await this.prisma.skill.delete({
      where: { id },
    });

    return { message: 'Skill deleted successfully!' };
  }
}
