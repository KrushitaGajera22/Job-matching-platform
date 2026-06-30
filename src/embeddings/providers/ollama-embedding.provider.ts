import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { EmbeddingProvider } from './embedding-provider';

@Injectable()
export class OllamaEmbeddingProvider implements EmbeddingProvider {
  async createEmbedding(text: string): Promise<number[]> {
    try {
      const response = await axios.post(
        `${process.env.OLLAMA_BASE_URL}/api/embed`,
        {
          model: process.env.OLLAMA_MODEL ?? 'nomic-embed-text',

          input: text,
        },
      );

      return response.data.embeddings[0];
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error(error.response?.data);
        console.error(error.message);
      } else {
        console.error(error);
      }

      throw error;
    }
  }
}
