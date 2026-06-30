import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MatchResultService {
  constructor(private readonly prisma: PrismaService) {}

  async saveMatchResult(data: {
    jobId: string;
    candidateId: string;

    vectorScore: number;
    skillScore: number;
    experienceScore: number;
    finalScore: number;

    jobTextHash: string;
    candidateTextHash: string;
  }) {
    return this.prisma.matchResult.upsert({
      where: {
        jobId_candidateId: {
          jobId: data.jobId,
          candidateId: data.candidateId,
        },
      },

      update: {
        vectorScore: data.vectorScore,
        skillScore: data.skillScore,
        experienceScore: data.experienceScore,
        finalScore: data.finalScore,

        jobTextHash: data.jobTextHash,
        candidateTextHash: data.candidateTextHash,
      },

      create: {
        vectorScore: data.vectorScore,
        skillScore: data.skillScore,
        experienceScore: data.experienceScore,
        finalScore: data.finalScore,
        jobTextHash: data.jobTextHash,
        candidateTextHash: data.candidateTextHash,

        job: {
          connect: {
            id: data.jobId,
          },
        },

        candidate: {
          connect: {
            id: data.candidateId,
          },
        },
      },
    });
  }
}
