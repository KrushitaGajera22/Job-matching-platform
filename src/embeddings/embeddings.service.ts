import { Inject, Injectable } from '@nestjs/common';
import { EmbeddingProvider } from './providers/embedding-provider';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EmbeddingsService {
  constructor(
    @Inject(EmbeddingProvider)
    private readonly provider: EmbeddingProvider,
    private readonly prisma: PrismaService,
  ) {}

  async createEmbedding(text: string): Promise<number[]> {
    return this.provider.createEmbedding(text);
  }

  async saveEmbedding(
    entityType: string,
    entityId: string,
    embedding: number[],
  ) {
    const vector = `[${embedding.join(',')}]`;

    await this.prisma.$executeRawUnsafe(
      `
      INSERT INTO "Embedding"
      (
        id,
        "entityType",
        "entityId",
        embedding,
        "createdAt",
        "updatedAt"
      )
      VALUES
      (
        gen_random_uuid(),
        $1,
        $2,
        $3::vector,
        NOW(),
        NOW()
      )
      ON CONFLICT
      ("entityType", "entityId")
      DO UPDATE SET
      embedding = EXCLUDED.embedding,
      "updatedAt" = NOW()
    `,
      entityType,
      entityId,
      vector,
    );
  }
}
