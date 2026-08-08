-- Create join table for batches and instructors
CREATE TABLE batch_instructors (
    batch_id BIGINT NOT NULL,
    instructor_id BIGINT NOT NULL,
    PRIMARY KEY (batch_id, instructor_id),
    CONSTRAINT fk_batch_inst_batch FOREIGN KEY (batch_id) REFERENCES batches (id) ON DELETE CASCADE,
    CONSTRAINT fk_batch_inst_user FOREIGN KEY (instructor_id) REFERENCES users (id) ON DELETE CASCADE
);

-- Migrate existing assignments from the old column
INSERT INTO batch_instructors (batch_id, instructor_id)
SELECT id, instructor_id 
FROM batches 
WHERE instructor_id IS NOT NULL;

-- Drop the old column
ALTER TABLE batches DROP COLUMN instructor_id;
