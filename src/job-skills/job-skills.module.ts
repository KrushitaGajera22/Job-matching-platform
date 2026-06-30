import { Module } from '@nestjs/common';
import { JobSkillsController } from './job-skills.controller';
import { JobSkillsService } from './job-skills.service';
import { PrismaModule } from '../prisma/prisma.module';
import { JobsModule } from '../jobs/jobs.module';
import { EmbeddingsModule } from '../embeddings/embeddings.module';

@Module({
  imports: [PrismaModule, JobsModule, EmbeddingsModule],
  controllers: [JobSkillsController],
  providers: [JobSkillsService],
})
export class JobSkillsModule {}
