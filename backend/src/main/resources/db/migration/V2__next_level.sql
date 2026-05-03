-- ============================================================
-- V2 — Next level additions
-- ============================================================

-- 1. Add slug + clinic_type to clinic (missing from V1)
ALTER TABLE clinic ADD COLUMN IF NOT EXISTS slug        VARCHAR(100) UNIQUE;
ALTER TABLE clinic ADD COLUMN IF NOT EXISTS clinic_type VARCHAR(50) NOT NULL DEFAULT 'general';
ALTER TABLE clinic ADD COLUMN IF NOT EXISTS logo_url    TEXT;
ALTER TABLE clinic ADD COLUMN IF NOT EXISTS active      BOOLEAN NOT NULL DEFAULT true;

-- Back-fill slug for existing rows
UPDATE clinic SET slug = lower(replace(name, ' ', '-')) WHERE slug IS NULL;

-- 2. form_definition — add version + description
ALTER TABLE form_definition ADD COLUMN IF NOT EXISTS version     INT NOT NULL DEFAULT 1;
ALTER TABLE form_definition ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE form_definition ADD COLUMN IF NOT EXISTS updated_at  TIMESTAMPTZ NOT NULL DEFAULT now();

-- 3. intake_submission — add form_definition link + IP
ALTER TABLE intake_submission ADD COLUMN IF NOT EXISTS form_def_id        UUID REFERENCES form_definition(id);
ALTER TABLE intake_submission ADD COLUMN IF NOT EXISTS submitted_from_ip  INET;
ALTER TABLE intake_submission ADD COLUMN IF NOT EXISTS user_agent          TEXT;

-- 4. intake_token — rename form_def_id to match entity (already correct if V1 used form_def_id)
--    Add a label column so staff can name tokens ("Reception iPad", "Email link")
ALTER TABLE intake_token ADD COLUMN IF NOT EXISTS label VARCHAR(200);

-- 5. Audit log (PIPEDA — never truncate/delete)
CREATE TABLE IF NOT EXISTS audit_log (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id       UUID,
    user_id         UUID,
    user_email      VARCHAR(200),
    action          VARCHAR(100) NOT NULL,
    entity_type     VARCHAR(50),
    entity_id       TEXT,
    ip_address      INET,
    user_agent      TEXT,
    meta            JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_clinic  ON audit_log(clinic_id);
CREATE INDEX IF NOT EXISTS idx_audit_entity  ON audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at DESC);

-- 6. GIN index for fast JSONB search on responses
CREATE INDEX IF NOT EXISTS idx_submission_responses ON intake_submission USING gin(responses);

-- 7. Full-text search on patient names
CREATE INDEX IF NOT EXISTS idx_submission_name ON intake_submission
    USING gin(to_tsvector('english', patient_first_name || ' ' || patient_last_name));
