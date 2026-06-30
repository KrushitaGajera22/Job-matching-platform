import { Module } from '@nestjs/common';
import { CandidateSkillsController } from './candidate-skills.controller';
import { CandidateSkillsService } from './candidate-skills.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CandidateSkillsController],
  providers: [CandidateSkillsService],
})
export class CandidateSkillsModule {}
