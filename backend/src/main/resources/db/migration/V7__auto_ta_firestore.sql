-- Add firestore_document_id column
ALTER TABLE generated_papers ADD COLUMN firestore_document_id VARCHAR(255);

-- Drop unused relational columns from generated_papers if they existed in earlier migrations
ALTER TABLE generated_papers DROP COLUMN IF EXISTS duration;
ALTER TABLE generated_papers DROP COLUMN IF EXISTS test_type;
ALTER TABLE generated_papers DROP COLUMN IF EXISTS chapters;
ALTER TABLE generated_papers DROP COLUMN IF EXISTS topics;
ALTER TABLE generated_papers DROP COLUMN IF EXISTS file_url;

-- Drop paper_questions join table
DROP TABLE IF EXISTS paper_questions CASCADE;

-- Drop generated_questions table
DROP TABLE IF EXISTS generated_questions CASCADE;

-- Drop review_history table
DROP TABLE IF EXISTS review_history CASCADE;

-- Drop paper_versions table
DROP TABLE IF EXISTS paper_versions CASCADE;
