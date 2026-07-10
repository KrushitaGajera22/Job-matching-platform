import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '../../generated/prisma/enums';
import { CreateCandidateUserData } from './dto/create-candidate-user.dto';
import { CreateRecruiterUserData } from './dto/create-recruiter-user.dto';
import { ActivateDeactivateDto } from './dto/activate-deactivate.dto';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { AdminDashboardDto } from './dto/admin-dashboard.dto';
import { Prisma } from '../../generated/prisma/client';
import { GetRecruiterDto } from './dto/get-recruiters.dto';
import { GetCandidateDto } from './dto/get-candidate.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string) {
    return this.prisma.user.findFirst({
      where: {
        email: {
          equals: email,
          mode: 'insensitive',
        },
      },
    });
  }

  async createCandidate(data: CreateCandidateUserData) {
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: data.email,
          password: data.password,
          role: Role.CANDIDATE,
          firstName: data.firstName,
          lastName: data.lastName,
        },
      });

      const candidate = await tx.candidate.create({
        data: {
          userId: user.id,
          firstName: data.firstName,
          lastName: data.lastName,
        },
      });

      return {
        user,
        candidate,
      };
    });
  }

  async createRecruiter(data: CreateRecruiterUserData) {
    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        role: Role.RECRUITER,
      },
    });
    return user;
  }

  async getRecruiters(query: GetRecruiterDto) {
    const { page, limit, search, sortBy, sortOrder } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {
      role: Role.RECRUITER,
    };

    if (search) {
      where.OR = [
        {
          firstName: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          lastName: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          email: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ];
    }

    const [data, totalCount] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [sortBy ?? 'createdAt']: sortOrder ?? 'desc',
        },
      }),

      this.prisma.user.count({
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

  async getRecruiter(id: string) {
    const recruiter = await this.prisma.user.findUnique({
      where: {
        id,
        role: Role.RECRUITER,
      },
    });
    if (!recruiter) {
      throw new BadRequestException('Recruiter not found');
    }

    const [totalJobs, publishedJobs, draftJobs, totalMatches, recentJobs] =
      await Promise.all([
        this.prisma.job.count(),

        this.prisma.job.count({
          where: {
            isPublished: true,
          },
        }),

        this.prisma.job.count({
          where: {
            isPublished: false,
          },
        }),

        this.prisma.matchResult.count(),

        this.prisma.job.findMany({
          take: 5,
          orderBy: {
            createdAt: 'desc',
          },
          select: {
            id: true,
            title: true,
            description: true,
            location: true,
            minExperience: true,
            maxExperience: true,
            isPublished: true,
            expiresAt: true,
            recruiterId: true,
            createdAt: true,
            updatedAt: true,
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
        }),
      ]);

    return {
      ...recruiter,
      stats: { totalJobs, publishedJobs, draftJobs, totalMatches },
      recentJobs,
    };
  }

  async activateDeactivateUser(data: ActivateDeactivateDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        id: data.id,
        role: {
          not: Role.ADMIN,
        },
      },
    });
    if (!user) {
      throw new BadRequestException('User not found');
    }
    if (user.isActive !== data.isActive) {
      await this.prisma.user.update({
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
      message: `User successfully ${data.isActive ? 'activated' : 'deactivated'}`,
    };
  }

  async getAllCandidates(query: GetCandidateDto) {
    const { page, limit, search, sortBy, sortOrder } = query;
    const skip = (page - 1) * limit;
    const where: Prisma.CandidateWhereInput = {};
    if (search) {
      const experience = Number(search);
      where.OR = [
        {
          firstName: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          lastName: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          currentTitle: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          location: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          phone: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          user: {
            email: {
              contains: search,
              mode: 'insensitive',
            },
          },
        },
        ...(Number.isNaN(experience)
          ? []
          : [
              {
                yearsExperience: {
                  equals: experience,
                },
              },
            ]),
      ];
    }

    const [data, totalCount] = await this.prisma.$transaction([
      this.prisma.candidate.findMany({
        where,
        skip,
        take: limit,

        orderBy: {
          [sortBy ?? 'createdAt']: sortOrder ?? 'desc',
        },

        include: {
          user: {
            select: {
              id: true,
              email: true,
              role: true,
              isActive: true,
            },
          },
        },
      }),

      this.prisma.candidate.count({
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

  async getCandidate(id: string) {
    const candidate = await this.prisma.candidate.findUnique({
      where: {
        id,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            isActive: true,
          },
        },
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
        resume: true,
      },
    });

    if (!candidate) {
      throw new BadRequestException('Candidate not found');
    }

    const [totalMatches, recentMatches] = await Promise.all([
      await this.prisma.matchResult.count({
        where: {
          candidateId: candidate.id,
        },
      }),

      await this.prisma.matchResult.findMany({
        where: {
          candidateId: candidate.id,
        },
        take: 5,
        orderBy: {
          generatedAt: 'desc',
        },
        select: {
          id: true,
          jobId: true,
          candidateId: true,
          vectorScore: true,
          skillScore: true,
          experienceScore: true,
          finalScore: true,
          candidate: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          job: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      }),
    ]);

    return {
      ...candidate,
      skills: candidate.skills.map((x) => x.skill.name),
      totalMatches,
      recentMatches,
    };
  }

  async updateUserProfile(id: string, data: UpdateUserProfileDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        id,
        role: {
          not: Role.CANDIDATE,
        },
      },
    });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const updatedUser = await this.prisma.user.update({
      where: {
        id,
      },
      data: {
        firstName: data.firstName ?? user.firstName,
        lastName: data.lastName ?? user.lastName,
      },
    });

    return updatedUser;
  }

  async getUserProfile(id: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id,
        role: {
          not: Role.CANDIDATE,
        },
      },
    });
    if (!user) {
      throw new BadRequestException('User not found');
    }
    return user;
  }

  async adminDashboard(): Promise<AdminDashboardDto> {
    const [
      totalRecruiters,
      totalCandidates,
      totalJobs,
      publishedJobs,
      draftJobs,
      totalMatches,
      recentRecruiters,
      recentCandidates,
      recentJobs,
    ] = await Promise.all([
      this.prisma.user.count({
        where: {
          role: Role.RECRUITER,
        },
      }),

      this.prisma.user.count({
        where: {
          role: Role.CANDIDATE,
        },
      }),

      this.prisma.job.count(),

      this.prisma.job.count({
        where: {
          isPublished: true,
        },
      }),

      this.prisma.job.count({
        where: {
          isPublished: false,
        },
      }),

      this.prisma.matchResult.count(),

      this.prisma.user.findMany({
        where: {
          role: Role.RECRUITER,
        },
        take: 5,
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          createdAt: true,
        },
      }),

      this.prisma.user.findMany({
        where: {
          role: Role.CANDIDATE,
        },
        take: 5,
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          createdAt: true,
        },
      }),

      this.prisma.job.findMany({
        take: 5,
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
          title: true,
          description: true,
          location: true,
          minExperience: true,
          maxExperience: true,
          isPublished: true,
          expiresAt: true,
          recruiterId: true,
          createdAt: true,
          updatedAt: true,
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
      }),
    ]);

    return {
      summary: {
        totalRecruiters,
        totalCandidates,
        totalJobs,
        publishedJobs,
        draftJobs,
        totalMatches,
      },
      recentRecruiters,
      recentCandidates,
      recentJobs: recentJobs.map((job) => ({
        ...job,
        skills: job.skills.map((x) => x.skill.name),
      })),
    };
  }
}
