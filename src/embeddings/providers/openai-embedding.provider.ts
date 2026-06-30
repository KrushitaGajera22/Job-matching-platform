import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { EmbeddingProvider } from './embedding-provider';

@Injectable()
export class OpenAIEmbeddingProvider implements EmbeddingProvider {
  private readonly openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async createEmbedding(text: string): Promise<number[]> {
    const response = await this.openai.embeddings.create({
      model: process.env.OPENAI_EMBEDDING_MODEL ?? 'text-embedding-3-small',
      input: text,
    });

    return response.data[0].embedding;
  }
}
