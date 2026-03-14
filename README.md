# Healthcare Cybersecurity Risk Management Platform

Production-ready Next.js 16 application for healthcare organizations to manage cybersecurity risk, track vulnerabilities, monitor compliance, coordinate incident response, and extend into broader enterprise security operations. This implementation follows the scope in `../PRD.MD`.

## Stack

- Next.js App Router + React + TypeScript
- Tailwind CSS v4
- Supabase PostgreSQL + Supabase Auth + RLS
- Recharts for analytics visualizations
- Zod for request and form validation
- Vercel deployment target

## Features

### Core modules

- Authentication: register, login, logout, protected routes
- Dashboard: security score, weighted risk score, vulnerability counts, active incidents, compliance score, backup status, and security alerts
- Devices: add and list organization-scoped assets with risk ratings
- Vulnerabilities: add findings, filter by severity, update remediation status
- Incidents: report incidents, assign severity, move through response statuses
- Compliance: track checklist items and aggregate compliance score
- Reports: generate organization-scoped JSON security reports
- Users: admin-only organization user directory with role management

### Enterprise extensions

- Risk assessment engine with weighted scoring and historical trend snapshots
- Access control monitoring with user activity logs and filters
- Vendor security management with risk and compliance tracking
- Staff cybersecurity training assignment and completion tracking
- Security alerts system with notification badge and dashboard alert panel
- Backup and recovery monitoring with job history and status tracking
- Expanded dashboard analytics for risk, vulnerability, incident, and training trends

## Project Structure

```text
app/
  api/
    alerts/
    audit-logs/
    backups/
    compliance/
    devices/
    incidents/
    reports/
    risk/
    training/
    users/
    vendors/
    vulnerabilities/
  audit-logs/
  backups/
  compliance/
  dashboard/
  devices/
  incidents/
  login/
  register/
  reports/
  risk/
  training/
  users/
  vendors/
  vulnerabilities/
components/
  forms/
    BackupJobForm.tsx
    ComplianceForm.tsx
    DeviceForm.tsx
    IncidentForm.tsx
    LoginForm.tsx
    RegisterForm.tsx
    TrainingRecordForm.tsx
    VendorForm.tsx
    VulnerabilityForm.tsx
  AppShell.tsx
  Charts.tsx
  DashboardCards.tsx
  DistributionChart.tsx
  MetricTrendChart.tsx
  Navbar.tsx
  SetupNotice.tsx
  Sidebar.tsx
lib/
  api.ts
  auth.ts
  data.ts
  moduleMap.ts
  mutations.ts
  observability.ts
  risk.ts
  supabaseClient.ts
  validation.ts
supabase/
  enterprise_phase2.sql
  schema.sql
  seed.sql
types/
  database.ts
proxy.ts
```

## Environment Variables

Create `.env.local` from `.env.example`:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## Supabase Setup

1. Create a new Supabase project.
2. In the Supabase SQL editor, run `supabase/schema.sql`.
3. Run `supabase/enterprise_phase2.sql`.
4. Enable email/password authentication in Supabase Auth.
5. Copy the project URL and anon key into `.env.local`.
6. Register one user in the app.
7. In the Supabase SQL editor, open `supabase/seed.sql`, replace `admin@hospital.org` with that registered email, and run it.

### New Database Tables

- `risk_assessments`
- `user_activity_logs`
- `vendors`
- `training_records`
- `security_alerts`
- `backup_jobs`

### Schema Notes

- `vendors` and `security_alerts` include `organization_id` even though the original brief omitted it. That is intentional so multi-tenant RLS remains enforceable.
- `training_records` and `user_activity_logs` scope access through `user_id` joined back to the organization user table.
- `risk_assessments` snapshots are recalculated automatically when vulnerabilities or incidents change, and they are also refreshed during dashboard/risk reads.
- `proxy.ts` logs `page_view` activity for authenticated users on protected routes. Action-specific events such as login, logout, incident reporting, and vendor updates are recorded in server actions and mutations.

## Run Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Demo Seed Data

To make the dashboard look populated:

1. Run `supabase/schema.sql`
2. Run `supabase/enterprise_phase2.sql`
3. Start the app and register a user
4. Open `supabase/seed.sql`
5. Replace the `seed_email` value with the email you registered
6. Run the seed in Supabase SQL Editor

The seed now populates both the core and enterprise modules:

- `devices`
- `vulnerabilities`
- `incidents`
- `compliance_checks`
- `vendors`
- `training_records`
- `backup_jobs`
- `security_alerts`
- `risk_assessments`
- `audit_logs`
- `user_activity_logs`

## API Endpoints

### Existing

- `GET|POST /api/devices`
- `GET|PUT|DELETE /api/devices/:id`
- `GET|POST /api/vulnerabilities`
- `GET|PUT|DELETE /api/vulnerabilities/:id`
- `GET|POST /api/incidents`
- `GET|PUT|DELETE /api/incidents/:id`
- `GET|POST /api/compliance`
- `GET|PUT|DELETE /api/compliance/:id`
- `GET /api/reports?type=executive|operations|compliance&format=json`
- `GET /api/users`
- `PUT /api/users/:id`

### Enterprise additions

- `GET /api/risk`
- `GET /api/audit-logs?user=<uuid>&action=<text>`
- `GET|POST|PATCH|DELETE /api/vendors`
- `GET|POST|PATCH /api/training`
- `GET|POST|PATCH /api/backups`
- `GET|PATCH /api/alerts`

Notes:

- `PATCH /api/vendors` expects `{ id, ...fieldsToUpdate }`
- `DELETE /api/vendors` expects `{ id }`
- All new mutation endpoints validate payloads with Zod and rely on Supabase session cookies plus RLS for authorization

## Running Migrations

Apply the SQL files in this order:

1. `supabase/schema.sql`
2. `supabase/enterprise_phase2.sql`
3. `supabase/seed.sql` (optional demo data)

## Deploy to Vercel

1. Push the project to GitHub.
2. Import the repository into Vercel.
3. Add the environment variables from `.env.local` to the Vercel project.
4. Deploy.
5. Confirm the Supabase project allows the Vercel domain in Auth URL settings if email confirmation flows are enabled.

## Notes

- The app uses Server Components for reads, server actions for internal UI mutations, and route handlers where REST endpoints are explicitly useful.
- Route protection and automatic page-view activity logging are handled in `proxy.ts`.
- Risk score formula implemented:
  - `(critical vulnerabilities x 5) + (high vulnerabilities x 3) + (medium vulnerabilities x 2) + (open incidents x 4)`
- Reports are generated from live application data and returned as JSON for downstream workflows.
