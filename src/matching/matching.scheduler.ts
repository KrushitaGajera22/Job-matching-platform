import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { MatchingService } from './matching.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MatchingScheduler {
  private readonly logger = new Logger(MatchingScheduler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly matchingService: MatchingService,
    private readonly configService: ConfigService,
  ) {}

  @Cron(process.env.MATCHING_CRON || '0 2 * * *')
  async handleNightlyMatching() {
    const enabled =
      this.configService.get<string>('MATCHING_ENABLED') === 'true';
    if (!enabled) {
      return;
    }

    this.logger.log('Starting nightly matching...');

    const jobs = await this.prisma.job.findMany({
      where: {
        isPublished: true,
      },
      select: {
        id: true,
      },
    });

    for (const job of jobs) {
      try {
        await this.matchingService.getMatches(job.id);
      } catch (error) {
        this.logger.error(
          `Failed to generate matches for job ${job.id}`,
          error instanceof Error ? error.stack : String(error),
        );
      }
    }

    this.logger.log('Nightly matching completed.');
  }
}
