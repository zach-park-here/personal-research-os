-- Add subtask_results column to research_results table
-- This tracks which sources came from which subtask

ALTER TABLE research_results
ADD COLUMN IF NOT EXISTS subtask_results JSONB DEFAULT '[]'::jsonb;

-- Comment for documentation
COMMENT ON COLUMN research_results.subtask_results IS 'Array of {subtask_id, subtask_title, query, sources[]} tracking sources per subtask';
