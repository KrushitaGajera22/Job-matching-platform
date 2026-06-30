import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '../../generated/prisma/enums';
import { CreateCandidateUserData } from './dto/create-candidate-user.dto';
import { CreateRecruiterUserData } from './dto/create-recruiter-user.dto';
import { ActivateDeactivateDto } from './dto/activate-deactivate.dto';

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
        role: Role.RECRUITER,
      },
    });
    return user;
  }

  async getRecruiters(page: number, limit: number) {
    // Calculate how many records to skip based on the current page
    const skip = (page - 1) * limit;

    // Use $transaction to run both the data fetch and the count fetch at the exact same time
    const [data, totalCount] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where: {
          role: Role.RECRUITER,
        },
        skip: skip,
        take: limit,
        orderBy: { id: 'desc' },
      }),
      this.prisma.user.count({
        where: {
          role: Role.RECRUITER,
        },
      }),
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
    return recruiter;
  }

  async activateDeactivateRecruiter(data: ActivateDeactivateDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: data.id,
        role: Role.RECRUITER,
      },
    });
    if (!user) {
      throw new BadRequestException('Recruiter not found');
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
      message: `Recruiter successfully ${data.isActive ? 'activated' : 'deactivated'}`,
    };
  }

  async getAllCandidates(page: number, limit: number) {
    // Calculate how many records to skip based on the current page
    const skip = (page - 1) * limit;

    // Use $transaction to run both the data fetch and the count fetch at the exact same time
    const [data, totalCount] = await this.prisma.$transaction([
      this.prisma.candidate.findMany({
        skip: skip,
        take: limit,
        orderBy: { id: 'desc' },
      }),
      this.prisma.candidate.count(),
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
}
