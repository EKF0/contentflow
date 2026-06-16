# Deployment Guide

## Prerequisites

- Node.js 20+
- npm 10+
- Vercel CLI (`npm i -g vercel`)
- Supabase project (database + realtime)
- Clerk account (authentication)
- OpenAI API key
- Stripe account (payments)

## Vercel Setup

1. **Connect repository**:
   ```bash
   vercel link
   ```

2. **Set environment variables** (see below) via Vercel dashboard or CLI:
   ```bash
   vercel env add DATABASE_URL
   vercel env add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
   # ... etc
   ```

3. **Deploy**:
   ```bash
   npm run deploy:staging   # preview deployment
   npm run deploy:prod      # production deployment
   ```

## Environment Variables

Copy `.env.production.example` and fill in real values:

| Variable | Where to find |
|----------|---------------|
| `DATABASE_URL` | Supabase → Settings → Database → Connection string (URI) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk Dashboard → API Keys |
| `CLERK_SECRET_KEY` | Clerk Dashboard → API Keys |
| `OPENAI_API_KEY` | platform.openai.com → API Keys |
| `STRIPE_SECRET_KEY` | Stripe Dashboard → Developers → API Keys |
| `STRIPE_WEBHOOK_SECRET` | Stripe Dashboard → Webhooks → signing secret |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe Dashboard → Developers → API Keys |

## Database Setup

1. **Push schema to production**:
   ```bash
   DATABASE_URL=<prod-url> npm run db:push
   ```

2. **Run migrations**:
   ```bash
   npm run db:migrate:prod
   ```

3. **Seed sample data** (optional):
   ```bash
   DATABASE_URL=<prod-url> npm run db:seed
   ```

## Go-Live Checklist

- [ ] All environment variables set in Vercel
- [ ] Database schema pushed (`db:push` or `db:migrate`)
- [ ] Clerk production keys configured
- [ ] Stripe webhook endpoint created (URL: `https://yourdomain.com/api/webhooks/stripe`)
- [ ] Custom domain added in Vercel
- [ ] SSL certificate verified
- [ ] CI passing on `main`
- [ ] Sentry or error monitoring configured
- [ ] `NEXT_PUBLIC_APP_URL` set to production domain
