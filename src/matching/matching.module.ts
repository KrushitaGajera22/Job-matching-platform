import { Module } from '@nestjs/common';
import { MatchingController } from './matching.controller';
import { MatchingService } from './matching.service';
import { PrismaModule } from '../prisma/prisma.module';
import { MatchExplanationService } from './match-explanation.service';
import { MatchResultService } from './macth-result.service';
import { MatchingScheduler } from './matching.scheduler';

@Module({
  imports: [PrismaModule],
  controllers: [MatchingController],
  providers: [
    MatchingService,
    MatchExplanationService,
    MatchResultService,
    MatchingScheduler,
  ],
})
export class MatchingModule {}
