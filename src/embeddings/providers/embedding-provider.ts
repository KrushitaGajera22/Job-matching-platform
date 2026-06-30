export abstract class EmbeddingProvider {
  abstract createEmbedding(text: string): Promise<number[]>;
}
