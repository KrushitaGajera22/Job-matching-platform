import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSkillsDto } from './dto/create-skill.dto';
import { UpdateSkillDto } from './dto/update-skill.dto';
import { ActiveDeactiveSkillDto } from './dto/active-deactive-skill.dto';

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

  async getSkills(page: number, limit: number) {
    // Calculate how many records to skip based on the current page
    const skip = (page - 1) * limit;

    // Use $transaction to run both the data fetch and the count fetch at the exact same time
    const [data, totalCount] = await this.prisma.$transaction([
      this.prisma.skill.findMany({
        skip: skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.skill.count(),
    ]);

    // Calculate the total number of pages
    const totalPages = Math.ceil(totalCount / limit);

    return {
      data,
      meta: {
        totalCount,
        currentPage: page,
        totalPages,
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
}
