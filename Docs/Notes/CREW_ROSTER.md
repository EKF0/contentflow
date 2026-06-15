# Crew Roster — ContentFlow

**Last Updated**: 2026-06-15

---

## Active Crew Members

| ID | Role | Expertise | Status |
|----|------|-----------|--------|
| `crew-fe` | Frontend Engineer | React 19, Next.js 14, Tailwind, component architecture | Available |
| `crew-be` | Backend Engineer | tRPC, Drizzle ORM, Supabase, Clerk, API design | Available |
| `crew-db` | Database Engineer | PostgreSQL, Drizzle ORM, schema design, migrations | Available |
| `crew-design` | Design Engineer | Tailwind, CSS tokens, theming, responsive design | Available |
| `crew-ai` | AI Engineer | OpenAI API, streaming, prompt engineering | Available |
| `crew-test` | QA Engineer | Vitest, Playwright, axe-core, performance testing | Available |
| `crew-devops` | DevOps Engineer | Vercel, GitHub Actions, Sentry, CI/CD | Available |
| `crew-pm` | Product Manager | Roadmap, sprint planning, issue management | Available |

## Coordination Rules

1. **One active crew member per task** — avoid context overlap
2. **Pass context via prompt** — crew members don't share memory
3. **Report back with status** — use Status/Summary/Files/Findings format
4. **Dependencies first** — crew-db before crew-be (schema before API)
5. **Review after implement** — crew-test validates after crew-fe/crew-be complete

## Sprint Assignments

### Sprint 1
- `crew-devops`: CF-001 (Project scaffolding)
- `crew-db`: CF-002 (Database schema)
- `crew-be`: CF-003 (Authentication)
