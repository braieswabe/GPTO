# GPTO Suite Deployment Guide

## Prerequisites

- Vercel account
- Neon PostgreSQL account
- Node.js 18+
- pnpm 8+

## Setup Steps

### 1. Clone and Install

```bash
git clone <repository-url>
cd GPTO
pnpm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and fill in:

- `NEON_DATABASE_URL` - Your Neon PostgreSQL connection string
- `NEON_PROJECT_ID` - Your Neon project ID
- `NEON_POOLER_HOST` - Your Neon pooler host
- `JWT_SECRET` - A secure random string for JWT signing
- `OPENAI_API_KEY` - (Optional) For AGCC content generation
- `ANTHROPIC_API_KEY` - (Optional) For AGCC content generation

### 3. Database Setup

```bash
# Generate migrations
pnpm --filter database generate

# Run migrations
pnpm db:migrate
```

### 4. Build

```bash
pnpm build
```

### 5. Deploy to Vercel

1. Connect your repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy

Vercel will automatically:
- Build the Next.js dashboard
- Deploy API routes
- Serve the Black Box runtime via CDN

## Post-Deployment

1. Create your first site via the dashboard
2. Install the Black Box script on your site
3. Configure telemetry endpoints
4. Start monitoring!

## Monitoring

- Vercel Analytics: Built-in
- Database: Neon dashboard
- Custom telemetry: Dashboard UI

## Troubleshooting

- Check Vercel function logs for API errors
- Verify Neon connection string
- Ensure environment variables are set correctly
