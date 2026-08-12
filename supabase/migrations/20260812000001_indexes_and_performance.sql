-- 20260812000001_indexes_and_performance.sql
-- High-performance PostgreSQL composite indexes for sub-10ms query execution under high concurrency.

-- 1. Resumes Query Optimization (user_id + created_at DESC)
CREATE INDEX IF NOT EXISTS idx_resumes_user_id_created 
  ON resumes(user_id, created_at DESC);

-- 2. Resume Analyses Optimization (user_id + created_at DESC)
CREATE INDEX IF NOT EXISTS idx_analyses_user_id_created 
  ON resume_analyses(user_id, created_at DESC);

-- 3. Job Applications Kanban & Filtering Optimization (user_id + status)
CREATE INDEX IF NOT EXISTS idx_applications_user_status 
  ON job_applications(user_id, status);

-- 4. Resume Versions History Lookup (resume_id + version_number DESC)
CREATE INDEX IF NOT EXISTS idx_versions_resume_id_version 
  ON resume_versions(resume_id, version_number DESC);

-- 5. pgvector Semantic Search Index (HNSW for rapid similarity queries)
CREATE INDEX IF NOT EXISTS idx_resume_chunks_embedding_hnsw 
  ON resume_chunks USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
