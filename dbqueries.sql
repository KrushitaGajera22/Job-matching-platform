ALTER TABLE "Embedding"
ADD COLUMN embedding vector(768);
-- ALTER TABLE "Embedding"
-- ADD COLUMN embedding vector(1536);
-- why 1536
-- For: text-embedding-3-small   OpenAI returns: 1536 dimensions

CREATE INDEX embedding_vector_idx
ON "Embedding"
USING ivfflat (embedding vector_cosine_ops);