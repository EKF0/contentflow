# ContentFlow Crew — Agent Roster

Specialized subagents for building ContentFlow from prototype to production SaaS. Spawn on-demand per task.

## Active Roles

| ID | Role | Spawn When | Expertise |
|----|------|-----------|-----------|
| crew-fe | Frontend Engineer | UI components, views, responsive, animations | React 19, Next.js 14 App Router, Tailwind, shadcn/ui patterns, Framer Motion |
| crew-be | Backend Engineer | API routes, auth flows, server actions, data mutations | tRPC, Drizzle ORM, Supabase, Clerk, Zod validation |
| crew-db | Database Engineer | Schema design, migrations, queries, performance | PostgreSQL, Drizzle ORM, indexing, query optimization, Supabase |
| crew-design | Design Engineer | Tokens, theming, component styling, layout | Tailwind config, CSS custom properties, design tokens, responsive design |
| crew-ai | AI Engineer | OpenAI integration, content generation, suggestions | OpenAI API, streaming, prompt engineering, structured output |
| crew-test | QA Engineer | Tests, E2E, accessibility, performance testing | Vitest, Playwright, axe-core, Lighthouse, k6 |
| crew-devops | DevOps Engineer | Deployment, CI/CD, monitoring, infrastructure | Vercel, GitHub Actions, Sentry, env management |
| crew-pm | Product Manager | Roadmap, sprint planning, issue management | Jira-style workflows, CSV roadmap, acceptance criteria |

## Coordination Rules

1. **One active crew member per task** — avoid context overlap
2. **Pass context via prompt** — crew members don't share memory
3. **Report back with status** — use the Status/Summary/Files/Findings format
4. **Dependencies first** — crew-db before crew-be (schema before API), crew-design before crew-fe (tokens before components)
5. **Review after implement** — crew-test validates after crew-fe/crew-be complete
