# BENTECH School Report Management System

A static web application for authorised school staff to view enrolments, manage assessment marks and print learner performance summaries. It supports Uganda O-Level and A-Level workflows and uses the existing BENTECH Supabase project.

## Repository
`mr-tumwebaze/reportsystem`

## Included
- Responsive dashboard and school switcher
- Supabase email/password authentication
- School membership and role-aware data access
- Student register
- Assessment selection and marks entry
- Learner report card with browser print support
- GitHub Pages deployment workflow

## Deploy
1. Upload the contents of this folder to the root of `mr-tumwebaze/reportsystem` (keep `.github/workflows/deploy.yml`).
2. In GitHub, open **Settings → Pages** and set **Build and deployment → Source** to **GitHub Actions**.
3. Push to `main`. The workflow publishes the site to `https://mr-tumwebaze.github.io/reportsystem/`.

## Existing Supabase connection
The application uses the existing project URL and a publishable/anon key. Publishable keys are designed for browser use; never put a `service_role` or secret key in this repository.

Project: `bentech school system`  
Ref: `gtfwedtafkbosdrihboh`

## Important first-time provisioning
The database currently has the required tables and RLS policies, but its school-related tables contain no records. The app only shows schools for which the signed-in user has an active `school_memberships` row. A platform administrator must create each school and assign the first owner membership through a trusted administrator workflow before staff can use the workspace. Do not disable RLS or expose service-role credentials.

The existing schema is multi-school. The database currently protects inserts/updates with role-based policies. Only users with the appropriate school role can create academic setup records or administer marks.

## Current feature boundary
This is the first deployable application baseline. It reads the existing schema and supports mark entry for assessments already created in the database. It does not yet include full CRUD screens for school setup, bulk CSV import, grading-band configuration, PDF generation, or administrator onboarding. Reports are printable browser pages; they are not yet formal UNEB report templates.
