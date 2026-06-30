import { Module } from '@nestjs/common';
import { ResumesController } from './resumes.controller';
import { ResumesService } from './resumes.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ResumeParserService } from './resume-parser.service';
import { EmbeddingsModule } from '../embeddings/embeddings.module';
import { CandidateTextBuilderService } from './candidate-text-builder.service';
import { HashModule } from '../common/hash/hash.module';

@Module({
  imports: [PrismaModule, EmbeddingsModule, HashModule],
  controllers: [ResumesController],
  providers: [ResumesService, ResumeParserService, CandidateTextBuilderService],
})
export class ResumesModule {}
