import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ActiveDeactiveCandidateDto } from './dto/active-deactive-candidate.dto';
import { Role } from '../../generated/prisma/enums';

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
}
