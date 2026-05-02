# ClinicFlow — Revised Scaffold

Generic digital intake for any small clinic type (chiro, physio, dental, massage, naturopath).

## What changed in this revision

### Backend

| Issue | Fix |
|---|---|
| No authentication — all submissions visible to anyone | JWT auth via Spring Security. Dashboard endpoint requires `Authorization: Bearer <token>`. |
| `Clinic.id` missing `@GeneratedValue` | Added `@GeneratedValue(strategy = GenerationType.UUID)`. |
| DTOs package-private — Jackson serialization failures | All DTO classes are now `public`. |
| `IntakeToken` had no expiry | Added `expires_at TIMESTAMPTZ` column; `isExpired()` check on every request. |
| `latestSubmissions()` returned data from all clinics | Now scoped: `findTop50ByClinicIdOrderBySubmittedAtDesc(clinicId)` — clinicId comes from the verified JWT, never from the request. |
| No form schema — frontend hardcoded fields | Added `form_definition` table with `schema JSONB`. Backend returns schema on token lookup. |

### Frontend

| Issue | Fix |
|---|---|
| Dashboard hit API server-side with no auth | Dashboard is now a client component; reads JWT from localStorage, redirects to `/login` on 401. |
| Intake form had hardcoded fields | Dynamic renderer — reads `schema.pages[].fields[]` from the API and renders them. Adding a new form type is a DB insert, not a code deploy. |
| No login page | `/login` page added; `POST /api/auth/login` returns JWT. |

## Architecture

```
clinic
  └── form_definition   (schema JSONB — what the form looks like)
        └── intake_token  (shareable link, optional expiry)
              └── intake_submission  (patient answers, JSONB)

clinic_user             (staff accounts for dashboard access)
```

## Getting started

```bash
# 1. Start Postgres
docker compose up -d

# 2. Run backend (Flyway migrates + seeds on first boot)
cd backend && ./mvnw spring-boot:run

# 3. Run frontend
cd frontend && npm install && npm run dev
```

Open http://localhost:3000

- **Patient intake:** http://localhost:3000/intake/demo-token-123
- **Staff login:** http://localhost:3000/login
  - Email: `staff@democlinic.ca`
  - Password: `demo1234`

## Adding a new clinic type (e.g. physiotherapy)

No code changes needed. Just insert rows:

```sql
INSERT INTO clinic (id, name) VALUES (gen_random_uuid(), 'Downtown Physio');

INSERT INTO form_definition (clinic_id, name, clinic_type, schema)
VALUES (
  '<clinic_id>',
  'Physiotherapy Intake v1',
  'physio',
  '{"pages": [{"title": "Injury", "fields": [{"name": "injuryArea", "label": "Area of injury", "type": "text"}]}]}'
);

INSERT INTO intake_token (token, clinic_id, form_def_id)
VALUES ('physio-abc', '<clinic_id>', '<form_def_id>');
```

The frontend renders it automatically.

## JWT secret

Update `clinicflow.jwt.secret` in `application.yml` before deploying. Must be ≥ 32 characters.
