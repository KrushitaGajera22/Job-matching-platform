CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE "Embedding"
ADD COLUMN embedding vector(768);

CREATE INDEX embedding_vector_idx
ON "Embedding"
USING ivfflat (embedding vector_cosine_ops);