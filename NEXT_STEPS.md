# ClinicFlow v5 — What Changed & What's Next

## What changed in this version

### Backend
| File | Change |
|------|--------|
| `V2__next_level.sql` | Adds slug, clinic_type, logo_url, audit_log, GIN indexes, token label |
| `AuditLog.java` | PIPEDA-compliant audit entity |
| `AuditService.java` | Async fire-and-forget audit logging |
| `IntakeService.java` | Wires in audit, adds search(), getDetail(), countSubmissions() |
| `IntakeController.java` | Adds GET /submissions/{id}, GET /stats, ?q= search, captures IP/UA |
| `IntakeSubmission.java` | Adds submittedFromIp, userAgent fields |
| `SubmissionDetail.java` | Full DTO with schema pages — enables label-driven detail view |
| `ClinicPrincipal.java` | Now carries userId + email (needed for audit trail) |
| `JwtService.java` | Issues userId into token, exposes extractUserId() |
| `JwtAuthFilter.java` | Extracts userId from JWT into principal |
| `AuthController.java` | Returns clinicName in login response |
| `Clinic.java` | Adds slug, clinic_type, logo_url, active |
| `ClinicUser.java` | Adds id (UUID), firstName, lastName, active |
| `application.yml` | Env var driven, adds async thread pool config |
| `ClinicFlowApplication.java` | Adds @EnableAsync |

### Frontend
| File | Change |
|------|--------|
| `lib/api.ts` | Adds saveClinicName / getClinicName helpers |
| `login/page.tsx` | Saves clinic name on successful login |
| `dashboard/page.tsx` | Stats bar, search, "View →" button, uses clinic name in heading |
| `dashboard/submissions/[id]/page.tsx` | **New** — full schema-driven detail page |
| `intake/[token]/page.tsx` | Multi-page wizard, all field types (radio, checkbox_group, range, signature_consent), back button, progress bar |

---

## Run it

```bash
docker compose up -d
cd backend && mvn spring-boot:run
# new terminal
cd frontend && npm install && npm run dev
```

Demo:
- Intake form:  http://localhost:3000/intake/demo-token-123
- Login:        http://localhost:3000/login  (demo@clinicflow.ca / demo1234)
- Dashboard:    http://localhost:3000/dashboard
- Detail view:  click "View →" on any row

---

## Next features to build (prioritised)

### 1. PDF export  ← highest clinical value
Generate a printable PDF of the completed intake form.

Backend: Add `iText7` to pom.xml, write `PdfService.java`
```java
// GET /api/dashboard/submissions/{id}/pdf
// Returns: application/pdf
```

Frontend: Add "Download PDF" button on detail page.

### 2. Clinic onboarding / self-signup
Let a new clinic register without you touching the DB.

```
POST /api/onboard
{ clinicName, clinicType, ownerEmail, ownerPassword }
→ creates clinic + clinic_user + default form_definition + demo token
```

### 3. Token management UI
Practitioners need to create/deactivate intake links from the dashboard.

```
GET  /api/dashboard/tokens         → list tokens
POST /api/dashboard/tokens         → create token { formDefId, label, expiresAt }
PUT  /api/dashboard/tokens/{token}/deactivate
```

### 4. Form definition editor
Let clinic owners edit their form schema from the dashboard.
Start simple: edit the JSON directly in a textarea, validate on save.
Later: drag-and-drop field builder.

### 5. Email notification on submission
When a patient submits, email the clinic:
```java
// In IntakeService.submit():
emailService.sendAsync(clinic.getEmail(),
    "New intake: " + firstName + " " + lastName,
    buildEmailBody(submission));
```

### 6. Stripe billing
Only add this after 2+ clinics are actively using the product.
- `/api/onboard` triggers Stripe Checkout
- Webhook updates clinic.status on payment events

---

## PIPEDA compliance status

| Requirement | Status |
|-------------|--------|
| Clinic data isolation via JWT clinicId | ✅ Done |
| IP address recorded on every submission | ✅ Done |
| Audit log on every staff view of patient record | ✅ Done |
| Token expiry | ✅ Done (null = permanent QR) |
| HTTPS in production | ⚠️ Needed — configure on Railway/Render |
| Data residency (Canada) | ⚠️ Use ca-central-1 AWS or Railway Canada region |
| Right to deletion endpoint | ❌ Not yet — add DELETE /api/dashboard/submissions/{id} |
| Privacy policy / BAA with clinics | ❌ Legal doc needed |
