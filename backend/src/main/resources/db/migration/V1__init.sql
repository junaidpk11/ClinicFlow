CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE clinic (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        VARCHAR(200) NOT NULL,
    email       VARCHAR(200),
    phone       VARCHAR(50),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Stores what a form looks like (generic field schema)
CREATE TABLE form_definition (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id   UUID NOT NULL REFERENCES clinic(id),
    name        VARCHAR(200) NOT NULL,
    clinic_type VARCHAR(50),           -- e.g. 'chiro', 'physio', 'dental'
    schema      JSONB NOT NULL,        -- field definitions consumed by frontend renderer
    active      BOOLEAN NOT NULL DEFAULT true,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE intake_token (
    token       VARCHAR(120) PRIMARY KEY,
    clinic_id   UUID NOT NULL REFERENCES clinic(id),
    form_def_id UUID NOT NULL REFERENCES form_definition(id),
    active      BOOLEAN NOT NULL DEFAULT true,
    expires_at  TIMESTAMPTZ,           -- NULL = never expires (for permanent kiosk links)
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE intake_submission (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id           UUID NOT NULL REFERENCES clinic(id),
    token               VARCHAR(120) NOT NULL REFERENCES intake_token(token),
    patient_first_name  VARCHAR(100) NOT NULL,
    patient_last_name   VARCHAR(100) NOT NULL,
    patient_email       VARCHAR(200),
    patient_phone       VARCHAR(50),
    responses           JSONB NOT NULL,
    submitted_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Clinic staff accounts (used for dashboard JWT auth)
CREATE TABLE clinic_user (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id   UUID NOT NULL REFERENCES clinic(id),
    email       VARCHAR(200) NOT NULL UNIQUE,
    password_hash VARCHAR(200) NOT NULL,  -- bcrypt
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_intake_submission_clinic_id  ON intake_submission(clinic_id);
CREATE INDEX idx_intake_submission_submitted_at ON intake_submission(submitted_at DESC);
CREATE INDEX idx_clinic_user_email ON clinic_user(email);

-- ── Seed data ────────────────────────────────────────────────────────────────
INSERT INTO clinic (id, name, email, phone)
VALUES ('11111111-1111-1111-1111-111111111111', 'Demo Chiropractic Clinic', 'demo@clinicflow.ca', '506-555-0100');

INSERT INTO form_definition (id, clinic_id, name, clinic_type, schema)
VALUES (
    '22222222-2222-2222-2222-222222222222',
    '11111111-1111-1111-1111-111111111111',
    'Chiropractic Intake Form v1',
    'chiro',
    '{
      "pages": [
        {
          "title": "Patient Info",
          "fields": [
            { "name": "dateOfBirth",  "label": "Date of birth",   "type": "date" },
            { "name": "phone",        "label": "Phone",            "type": "tel"  },
            { "name": "email",        "label": "Email",            "type": "email"}
          ]
        },
        {
          "title": "Current Concern",
          "fields": [
            { "name": "primaryComplaint",    "label": "What brings you in today?",                   "type": "textarea" },
            { "name": "symptomsStarted",     "label": "When did this start?",                         "type": "text"     },
            { "name": "painLevel",           "label": "Pain level (0 – 10)",                          "type": "range", "min": 0, "max": 10 },
            { "name": "previousTreatment",   "label": "Have you had previous treatment for this?",    "type": "textarea" }
          ]
        },
        {
          "title": "Consent",
          "fields": [
            { "name": "consentAccepted", "label": "I confirm the information is accurate and consent to the clinic using it for care administration.", "type": "checkbox", "required": true }
          ]
        }
      ]
    }'
);

INSERT INTO intake_token (token, clinic_id, form_def_id)
VALUES ('demo-token-123', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222');

-- Demo staff account — password is "demo1234" (bcrypt, cost 10)
INSERT INTO clinic_user (clinic_id, email, password_hash)
VALUES (
    '11111111-1111-1111-1111-111111111111',
    'staff@democlinic.ca',
    '$2a$10$7EqJtq98hPqEX7fNZaFWoO7l2jvQR98.A0i8V0qZ9qm.Qz5dZm/pi'
);
