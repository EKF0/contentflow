# ContentFlow

An Airtable-inspired editorial content planner built with Next.js, tRPC, and Supabase.

Three core views: Grid (editable spreadsheet), Kanban (status cards), Calendar (publish schedule). AI-powered content suggestions, templates, and collaboration features.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) + TypeScript strict |
| Styling | Tailwind CSS 4, token-based design system |
| Database | PostgreSQL (Supabase) + Drizzle ORM |
| Auth | Clerk (Google, GitHub, email magic link) |
| Realtime | Supabase Realtime |
| API | tRPC v11 |
| AI | OpenAI API |
| Payments | Stripe |

## Prerequisites

- Node.js 18+
- PostgreSQL (via Supabase or local)
- Clerk account (auth)
- OpenAI API key (AI features)

## Installation

```bash
git clone <repo-url>
cd contentflow
npm install
```

## Environment Variables

Create `.env.local`:

```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/contentflow

# Clerk Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...

# Supabase Realtime
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# OpenAI
OPENAI_API_KEY=sk-...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Running Locally

```bash
# Push database schema
npm run db:push

# Seed sample data (18 editorial records)
npm run db:seed

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Building for Production

```bash
npm run build
npm run start
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint check |
| `npm run lint:fix` | ESLint auto-fix |
| `npm run format` | Prettier format |
| `npm run typecheck` | TypeScript type check |
| `npm run test` | Vitest unit tests |
| `npm run test:e2e` | Playwright E2E tests |
| `npm run db:generate` | Generate Drizzle migrations |
| `npm run db:migrate` | Run pending migrations |
| `npm run db:push` | Push schema to database |
| `npm run db:seed` | Seed sample data |

## Project Structure

```
src/
├── app/              # Next.js App Router pages
├── components/       # React components
│   ├── layout/       # App shell (sidebar, toolbar, top bar)
│   ├── ui/           # Reusable primitives (Button, Input, Badge)
│   └── views/        # Grid, Kanban, Calendar views
├── hooks/            # Custom React hooks
├── lib/              # Utilities, config, DB schema
│   ├── db/           # Drizzle schema, seed, migrations
│   └── trpc/         # tRPC client setup
├── server/           # tRPC routers
│   └── routers/      # API procedure definitions
└── middleware.ts     # Next.js middleware
```

## Further Reading

- [Architecture](./ARCHITECTURE.md) — system design and data flow
- [API Reference](./API.md) — tRPC router documentation
- [Field Types](./FIELDS.md) — all 18 field types and configuration
- [Views](./VIEWS.md) — Grid, Kanban, Calendar view features
- [Changelog](./CHANGELOG.md) — version history
