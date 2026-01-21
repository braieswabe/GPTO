# Environment Variables Setup

## Quick Setup

1. Copy this template to create your `.env` file:
```bash
cp ENV_SETUP.md .env
# Then edit .env and replace placeholder values
```

## Required Environment Variables

### Database Configuration (Required)

```bash
# Pooled connection (recommended for queries)
DATABASE_URL=postgresql://neondb_owner:npg_RCD46jZEesyg@ep-orange-dust-ahpmexg3-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require

# Non-pooled connection (required for migrations)
DATABASE_URL_UNPOOLED=postgresql://neondb_owner:npg_RCD46jZEesyg@ep-orange-dust-ahpmexg3.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require

# Alternative formats (also supported)
POSTGRES_URL=${DATABASE_URL}
POSTGRES_URL_NON_POOLING=${DATABASE_URL_UNPOOLED}
NEON_DATABASE_URL=${DATABASE_URL}
```

### Authentication (Required)

```bash
# Generate a secure random string (min 32 characters)
JWT_SECRET=your-secret-key-change-in-production-min-32-chars
JWT_EXPIRES_IN=7d
```

## Optional Environment Variables

### External LLM APIs (for AGCC)

```bash
OPENAI_API_KEY=your-openai-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key
```

### Email Service

```bash
# Choose one:
SENDGRID_API_KEY=your-sendgrid-api-key
# OR
RESEND_API_KEY=your-resend-api-key
```

### Rate Limiting (Upstash Redis)

```bash
UPSTASH_REDIS_REST_URL=your-upstash-redis-url
UPSTASH_REDIS_REST_TOKEN=your-upstash-redis-token
```

### CORS Configuration

```bash
ALLOWED_ORIGINS=http://localhost:3000,https://your-domain.com
```

### Vercel (set automatically in Vercel dashboard)

```bash
VERCEL_URL=
VERCEL_ENV=development
```

## Complete .env Template

```bash
# Database (Required)
DATABASE_URL=postgresql://neondb_owner:npg_RCD46jZEesyg@ep-orange-dust-ahpmexg3-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require
DATABASE_URL_UNPOOLED=postgresql://neondb_owner:npg_RCD46jZEesyg@ep-orange-dust-ahpmexg3.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require

# Authentication (Required)
JWT_SECRET=your-secret-key-change-in-production-min-32-chars
JWT_EXPIRES_IN=7d

# External Services (Optional)
OPENAI_API_KEY=your-openai-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key
SENDGRID_API_KEY=your-sendgrid-api-key
RESEND_API_KEY=your-resend-api-key

# Rate Limiting (Optional)
UPSTASH_REDIS_REST_URL=your-upstash-redis-url
UPSTASH_REDIS_REST_TOKEN=your-upstash-redis-token

# CORS
ALLOWED_ORIGINS=http://localhost:3000,https://your-domain.com

# Environment
NODE_ENV=development
```

## For Vercel Deployment

Add all these variables in the Vercel Dashboard:
1. Go to Project Settings → Environment Variables
2. Add each variable for Production, Preview, and Development environments
3. Make sure `DATABASE_URL` uses the pooled connection
4. Make sure `DATABASE_URL_UNPOOLED` uses the non-pooled connection

## Security Notes

⚠️ **Never commit `.env` file to git** - it's already in `.gitignore`

⚠️ **Change `JWT_SECRET` in production** - use a strong random string

⚠️ **Use environment-specific values** - different secrets for dev/staging/prod
