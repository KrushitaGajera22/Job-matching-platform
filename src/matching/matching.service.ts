import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MatchExplanationService } from './match-explanation.service';
import { MatchResultService } from './macth-result.service';

@Injectable()
export class MatchingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly matchExplanationService: MatchExplanationService,
    private readonly matchResultService: MatchResultService,
  ) {}

  async getMatches(jobId: string) {
    const job = await this.prisma.job.findUnique({
      where: {
        id: jobId,
      },
      include: {
        skills: true,
      },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    const jobEmbedding = await this.prisma.embedding.findUnique({
      where: {
        entityType_entityId: {
          entityType: 'job',
          entityId: job.id,
        },
      },
    });

    if (!jobEmbedding) {
      throw new NotFoundException('Job embedding not found');
    }

    const vectorMatches = await this.getVectorMatches(job.id);
    const jobSkillIds = job.skills.map((skill) => skill.skillId);

    const matches = await Promise.all(
      vectorMatches.map(async (match) => {
        const candidate = await this.prisma.candidate.findUnique({
          where: {
            id: match.candidateId,
          },
          include: {
            skills: true,
            resume: true,
          },
        });

        if (!candidate) {
          return null;
        }

        const candidateSkillIds = candidate.skills.map(
          (skill) => skill.skillId,
        );

        const skillScore = this.calculateSkillScore(
          candidateSkillIds,
          jobSkillIds,
        );

        const experienceScore = this.calculateExperienceScore(
          candidate.yearsExperience,
          job.minExperience,
          job.maxExperience,
        );

        const finalScore =
          match.vectorScore * 0.6 + skillScore * 0.3 + experienceScore * 0.1;

        const matchResult = await this.matchResultService.saveMatchResult({
          jobId: job.id,
          candidateId: candidate.id,
          vectorScore: match.vectorScore,
          skillScore,
          experienceScore,
          finalScore,
          jobTextHash: job.textHash!,
          candidateTextHash: candidate!.resume!.textHash!,
        });
        return {
          candidate,
          vectorScore: Number(match.vectorScore.toFixed(2)),
          skillScore: Number(skillScore.toFixed(2)),
          experienceScore: Number(experienceScore.toFixed(2)),
          finalScore: Number(finalScore.toFixed(2)),
          matchPercentage: Math.round(finalScore * 100),
          matchResult,
        };
      }),
    );

    const topCandidates = matches
      .filter(Boolean)
      .sort((a, b) => b!.finalScore - a!.finalScore)
      .slice(0, 5);

    const candidatesWithExplanation = await Promise.all(
      topCandidates.map(async (match, index) => {
        const explanation = await this.matchExplanationService.getOrGenerate(
          job.id,
          match!.candidate.id,
        );

        return {
          rank: index + 1,
          candidateId: match!.candidate.id,
          firstName: match!.candidate.firstName,
          lastName: match!.candidate.lastName,
          yearsExperience: match!.candidate.yearsExperience,
          vectorScore: match!.vectorScore,
          skillScore: match!.skillScore,
          experienceScore: match!.experienceScore,
          finalScore: match!.finalScore,
          matchPercentage: match!.matchPercentage,
          // explanation,
          strengths: explanation.strengths,
          gaps: explanation.gaps,
          pitch: explanation.pitch,
        };
      }),
    );
    return {
      jobId: job.id,
      totalMatches: matches.filter(Boolean).length,
      topCandidates: candidatesWithExplanation,
    };
  }

  private async getVectorMatches(jobId: string) {
    const results = await this.prisma.$queryRawUnsafe<
      {
        candidateId: string;
        vectorScore: number;
      }[]
    >(
      `
        SELECT
          r."candidateId" as "candidateId",
          1 - (
            e.embedding <=>
            (
              SELECT embedding
              FROM "Embedding"
              WHERE "entityType" = 'job'
              AND "entityId" = $1
            )
          ) as "vectorScore"
        FROM "Embedding" e
        INNER JOIN "Resume" r
          ON r.id = e."entityId"
        WHERE e."entityType" = 'resume'
        ORDER BY
          e.embedding <=>
          (
            SELECT embedding
            FROM "Embedding"
            WHERE "entityType" = 'job'
            AND "entityId" = $1
          )
        LIMIT 20
    `,
      jobId,
    );

    return results;
  }

  private calculateSkillScore(
    candidateSkillIds: string[],
    jobSkillIds: string[],
  ): number {
    if (!jobSkillIds.length) {
      return 0;
    }

    const candidateSet = new Set(candidateSkillIds);

    const matched = jobSkillIds.filter((skillId) =>
      candidateSet.has(skillId),
    ).length;

    return matched / jobSkillIds.length;
  }

  private calculateExperienceScore(
    candidateExperience: number | null,
    minExperience: number | null,
    maxExperience: number | null,
  ): number {
    if (candidateExperience === null || minExperience === null) {
      return 0;
    }

    if (
      candidateExperience >= minExperience &&
      (!maxExperience || candidateExperience <= maxExperience)
    ) {
      return 1;
    }

    if (candidateExperience < minExperience) {
      return candidateExperience / minExperience;
    }

    return 1;
  }
}
