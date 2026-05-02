# ClinicFlow Next Steps

## 1. Run the scaffold locally

```bash
docker compose up -d
cd backend
mvn spring-boot:run
```

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open:

- Public intake: http://localhost:3000/intake/demo-token-123
- Staff login: http://localhost:3000/login
- Dashboard: http://localhost:3000/dashboard

Demo staff account:

```text
staff@democlinic.ca / demo1234
```

## 2. Confirm the vertical slice

Submit one intake form, log in, and verify the dashboard shows only that clinic's submissions.

## 3. Replace the demo schema with your chiropractic form

Edit `backend/src/main/resources/db/migration/V1__init.sql`, specifically the JSON inserted into `form_definition.schema`.

Add fields from the scanned forms in this order:

1. Patient demographics
2. Contact information
3. Current complaint
4. Pain scale
5. Health history
6. Lifestyle questions
7. Consent checkbox

## 4. Add the next production safeguards

Before showing real patient data to a clinic, add:

- HTTPS in deployment
- stronger JWT secret from environment variable
- no demo passwords in production
- audit log table for staff viewing/downloading submissions
- backup/restore plan for PostgreSQL

## 5. Add high-value clinical features next

After the current flow works:

1. Submission detail page
2. PDF generation
3. Pain diagram field type
4. Signature field type
5. Clinic-specific branding/logo

Do not add Stripe, SMS, scheduling, or billing until at least one clinic has tested the intake workflow.
