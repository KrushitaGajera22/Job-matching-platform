import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ActiveDeactiveCandidateDto } from './dto/active-deactive-candidate.dto';
import { Role } from '../../generated/prisma/enums';
import { CandidateDashboardDto } from './dto/candidate-dashboard.dto';
import { GetRecommendedJobDto } from './dto/get-recommended-job.dto';
import { Prisma } from '../../generated/prisma/client';

@Injectable()
export class CandidatesService {
  constructor(private readonly prisma: PrismaService) {}

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const candidate = await this.prisma.candidate.findUnique({
      where: { userId },
    });

    if (!candidate) {
      throw new NotFoundException('Candidate not found');
    }

    if (!dto || Object.keys(dto).length === 0) {
      throw new BadRequestException('At least one field is required');
    }

    return this.prisma.candidate.update({
      where: { userId },
      data: dto,
    });
  }

  async getProfile(userId: string) {
    return this.prisma.candidate.findUnique({
      where: {
        userId,
      },
    });
  }

  async activeDeactiveCandidate(
    userId: string,
    data: ActiveDeactiveCandidateDto,
  ) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
        role: Role.CANDIDATE,
      },
    });
    if (!user) {
      throw new BadRequestException('User not found');
    }
    if (user.isActive !== data.isActive) {
      await this.prisma.user.update({
        where: {
          id: userId,
        },
        data: {
          isActive: data.isActive,
        },
      });
    }

    return {
      success: true,
      message: `Candidate successfully ${data.isActive ? 'activated' : 'deactivated'}`,
    };
  }

  async getDashboard(candidateId: string): Promise<CandidateDashboardDto> {
    const candidate = await this.getProfile(candidateId);
    if (!candidate) {
      throw new BadRequestException('Candidate Not found!');
    }
    const [resume, skills, recommendedJobs, recommendedJobsCount] =
      await Promise.all([
        this.prisma.resume.findFirst({
          where: {
            candidateId: candidate.id,
          },
        }),

        this.prisma.candidateSkill.findMany({
          where: {
            candidateId: candidate.id,
          },
          select: {
            skill: {
              select: {
                name: true,
              },
            },
          },
        }),

        await this.prisma.matchResult.findMany({
          where: {
            candidateId: candidate.id,
            job: {
              isPublished: true,
            },
          },
          take: 5,
          orderBy: {
            finalScore: 'desc',
          },
          select: {
            id: true,
            jobId: true,
            candidateId: true,
            vectorScore: true,
            skillScore: true,
            experienceScore: true,
            finalScore: true,

            job: {
              select: {
                id: true,
                title: true,
                location: true,
              },
            },
          },
        }),

        this.prisma.matchResult.count({
          where: {
            candidateId: candidate.id,
          },
        }),
      ]);

    const profileScore = await this.calculateProfileScore(candidate.id);

    return {
      summary: {
        recommendedJobsCount,
        resumeUploaded: !!resume,
        profileScore,
      },
      recommendedMatches: recommendedJobs,
      skills: skills.map((skill) => skill.skill.name),
    };
  }

  async getJob(jobId: string, candidateId: string) {
    const job = await this.prisma.job.findUnique({
      where: {
        id: jobId,
        isPublished: true,
      },
      select: {
        id: true,
        title: true,
        description: true,
        location: true,
        minExperience: true,
        maxExperience: true,
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
      throw new BadRequestException('Job not found');
    }
    const candidate = await this.getProfile(candidateId);
    if (!candidate) {
      throw new BadRequestException('Candidate Not found!');
    }

    const matchresult = await this.prisma.matchResult.findMany({
      where: {
        candidateId: candidate.id,
        jobId,
      },
      select: {
        id: true,
        jobId: true,
        candidateId: true,
        vectorScore: true,
        skillScore: true,
        experienceScore: true,
        finalScore: true,
      },
    });
    return {
      ...job,
      finalScore: Number(matchresult[0].finalScore.toFixed(2)),
      matchPercentage: Math.round(matchresult[0].finalScore * 100),
      skills: job.skills.map((jobSkill) => jobSkill.skill),
    };
  }

  async getRecommendedJobs(candidateId: string, query: GetRecommendedJobDto) {
    const { page = 1, limit = 10, search } = query;
    const skip = (page - 1) * limit;
    const candidate = await this.getProfile(candidateId);
    if (!candidate) {
      throw new BadRequestException('Candidate not found!');
    }

    const where: Prisma.MatchResultWhereInput = {
      candidateId: candidate.id,
      job: {
        isPublished: true,
      },
      ...(search && {
        job: {
          OR: [
            {
              title: {
                contains: search,
                mode: 'insensitive',
              },
            },
            {
              description: {
                contains: search,
                mode: 'insensitive',
              },
            },
          ],
        },
      }),
    };

    const [matches, total] = await this.prisma.$transaction([
      this.prisma.matchResult.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [query.sortBy ?? 'finalScore']: query.sortOrder ?? 'desc',
        },
        select: {
          id: true,
          jobId: true,
          candidateId: true,
          vectorScore: true,
          skillScore: true,
          experienceScore: true,
          finalScore: true,

          job: {
            select: {
              id: true,
              title: true,
              description: true,
              location: true,
              minExperience: true,
              maxExperience: true,
            },
          },
        },
      }),

      this.prisma.matchResult.count({
        where,
      }),
    ]);

    return {
      data: matches,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  private async calculateProfileScore(candidateId: string): Promise<number> {
    const candidate = await this.prisma.candidate.findUnique({
      where: {
        id: candidateId,
      },
      include: {
        resume: true,
        skills: true,
      },
    });

    let score = 0;

    if (candidate?.firstName) score += 20;
    if (candidate?.lastName) score += 20;
    if (candidate?.resume) score += 20;
    if (candidate?.skills.length) score += 20;
    if (candidate?.yearsExperience) score += 20;
    return score;
  }
}
