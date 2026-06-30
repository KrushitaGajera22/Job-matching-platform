import { Module } from '@nestjs/common';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';
import { PrismaModule } from '../prisma/prisma.module';
import { JobTextBuilderService } from './job-text-builder.service';
import { EmbeddingsModule } from '../embeddings/embeddings.module';
import { HashModule } from '../common/hash/hash.module';

@Module({
  imports: [PrismaModule, EmbeddingsModule, HashModule],
  controllers: [JobsController],
  providers: [JobsService, JobTextBuilderService],
  exports: [JobsService],
})
export class JobsModule {}
