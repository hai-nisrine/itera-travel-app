-- 009: organizer trip drafts 

CREATE TABLE IF NOT EXISTS trip_drafts (
    id SERIAL PRIMARY KEY,
    organizer_id INTEGER NOT NULL,
    prompt TEXT NOT NULL,
    title VARCHAR(80) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_draft_organizer
        FOREIGN KEY (organizer_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT chk_prompt_length
        CHECK (char_length(prompt) BETWEEN 1 AND 2000)
);

CREATE INDEX IF NOT EXISTS idx_trip_drafts_organizer
    ON trip_drafts (organizer_id, created_at DESC);