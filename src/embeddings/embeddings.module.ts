import { Module } from '@nestjs/common';

import { EmbeddingsService } from './embeddings.service';

import { EmbeddingProvider } from './providers/embedding-provider';
import { OllamaEmbeddingProvider } from './providers/ollama-embedding.provider';
import { OpenAIEmbeddingProvider } from './providers/openai-embedding.provider';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [
    EmbeddingsService,
    {
      provide: EmbeddingProvider,
      useClass:
        process.env.EMBEDDING_PROVIDER === 'openai'
          ? OpenAIEmbeddingProvider
          : OllamaEmbeddingProvider,
    },
    OllamaEmbeddingProvider,
    OpenAIEmbeddingProvider,
  ],
  exports: [EmbeddingsService],
})
export class EmbeddingsModule {}
