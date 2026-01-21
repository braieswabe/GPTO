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

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` and fill in your values:

**Required:**
- `DATABASE_URL` - Your Neon PostgreSQL pooled connection string
- `DATABASE_URL_UNPOOLED` - Non-pooled connection for migrations
- `JWT_SECRET` - A secure random string (min 32 characters)

**Optional (for full functionality):**
- `OPENAI_API_KEY` - For AGCC content generation
- `ANTHROPIC_API_KEY` - For AGCC content generation
- `SENDGRID_API_KEY` or `RESEND_API_KEY` - For email servo
- `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` - For rate limiting

### 3. Database Setup

```bash
# Generate migrations
pnpm db:generate

# Run migrations (uses DATABASE_URL_UNPOOLED automatically)
pnpm db:migrate
```

**Note:** Migrations should use the non-pooled connection (`DATABASE_URL_UNPOOLED`) to avoid connection limit issues.

### 4. Build

```bash
# Build all packages
pnpm build

# Or build just the dashboard
pnpm --filter dashboard build
```

### 5. Deploy to Vercel

1. **Connect Repository**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Add New Project"
   - Import your GitHub repository

2. **Configure Project Settings**
   - Framework Preset: Other
   - Root Directory: `apps/dashboard` (or leave as root)
   - Build Command: `cd ../.. && pnpm build`
   - Output Directory: `apps/dashboard/.next`
   - Install Command: `pnpm install`

3. **Set Environment Variables in Vercel**
   Add all variables from your `.env` file:
   - `DATABASE_URL` (pooled connection)
   - `DATABASE_URL_UNPOOLED` (non-pooled for migrations)
   - `JWT_SECRET`
   - `OPENAI_API_KEY` (if using)
   - `ANTHROPIC_API_KEY` (if using)
   - `ALLOWED_ORIGINS` (your Vercel domain)

4. **Deploy**
   - Click "Deploy"
   - Vercel will build and deploy automatically

### 6. Run Migrations on Production

After first deployment, run migrations:

```bash
# Set production DATABASE_URL_UNPOOLED in your environment
export DATABASE_URL_UNPOOLED="your-non-pooled-connection-string"

# Run migrations
pnpm db:migrate
```

Or use Vercel CLI:
```bash
vercel env pull .env.production
pnpm db:migrate
```

## Post-Deployment

1. **Create your first site** via the dashboard
2. **Install the Black Box script** on your site:
   ```html
   <script
     src="https://your-vercel-app.vercel.app/black-box.js"
     data-config-url="https://your-vercel-app.vercel.app/api/sites/[site-id]/config"
     data-telemetry-url="https://your-vercel-app.vercel.app/api/telemetry/events"
     data-site-id="your-site-id"
     async
   ></script>
   ```
3. **Configure telemetry endpoints**
4. **Start monitoring!**

## Environment Variables Reference

### Database (Required)
- `DATABASE_URL` - Pooled PostgreSQL connection (for queries)
- `DATABASE_URL_UNPOOLED` - Non-pooled connection (for migrations)

### Authentication (Required)
- `JWT_SECRET` - Secret key for JWT signing (min 32 chars)

### External Services (Optional)
- `OPENAI_API_KEY` - OpenAI API key for AGCC
- `ANTHROPIC_API_KEY` - Anthropic API key for AGCC
- `SENDGRID_API_KEY` or `RESEND_API_KEY` - Email service
- `UPSTASH_REDIS_REST_URL` - Redis URL for rate limiting
- `UPSTASH_REDIS_REST_TOKEN` - Redis token for rate limiting

### CORS (Required for production)
- `ALLOWED_ORIGINS` - Comma-separated list of allowed origins

## Monitoring

- **Vercel Analytics**: Built-in with Vercel deployment
- **Database**: Neon dashboard for query performance
- **Custom telemetry**: Dashboard UI for application metrics

## Troubleshooting

### Database Connection Issues

- **Error: "connection limit exceeded"**
  - Use `DATABASE_URL_UNPOOLED` for migrations
  - Check connection pool settings in Neon dashboard

- **Error: "SSL required"**
  - Ensure connection string includes `?sslmode=require`
  - Check Neon SSL settings

### Build Failures

- **Module not found errors**
  - Ensure `pnpm install` runs successfully
  - Check workspace dependencies are linked

- **TypeScript errors**
  - Run `pnpm type-check` locally first
  - Ensure all packages are built: `pnpm build`

### Deployment Issues

- **Vercel build timeout**
  - Increase build timeout in Vercel settings
  - Optimize build process (split into smaller steps)

- **Environment variables not found**
  - Verify all variables are set in Vercel dashboard
  - Check variable names match exactly (case-sensitive)

## Next Steps

- Set up monitoring and alerts
- Configure custom domain
- Set up CI/CD pipeline
- Enable Vercel Analytics
- Configure backup strategy for Neon database
