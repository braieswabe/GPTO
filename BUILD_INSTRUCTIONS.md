# GPTO Suite - Build Instructions

## Prerequisites

- **Node.js**: 18.0.0 or higher
- **pnpm**: 8.0.0 or higher
- **Git**: For version control

## Quick Start

### 1. Install Dependencies

```bash
# Install pnpm if you don't have it
npm install -g pnpm

# Install all dependencies
pnpm install
```

### 2. Set Up Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` and fill in your values (for local development, you can use placeholder values):

```env
# Database (optional for frontend-only development)
NEON_DATABASE_URL=postgresql://user:password@host/database
NEON_PROJECT_ID=your-project-id
NEON_POOLER_HOST=your-pooler-host.neon.tech

# JWT Secret (generate a random string)
JWT_SECRET=your-secret-key-change-in-production

# API Keys (optional for local dev)
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key

# CORS Origins
ALLOWED_ORIGINS=http://localhost:3000
```

### 3. Build the Project

```bash
# Build all packages
pnpm build

# Or build just the dashboard
pnpm --filter dashboard build
```

### 4. Run Development Server

```bash
# Start the dashboard development server
pnpm dev

# Or directly
pnpm --filter dashboard dev
```

The dashboard will be available at `http://localhost:3000`

## Project Structure

```
GPTO/
├── apps/
│   ├── dashboard/          # Next.js frontend application
│   └── black-box/          # Black Box runtime (CDN)
├── packages/
│   ├── api/                # Shared API utilities
│   ├── database/           # Database schema and migrations
│   ├── schemas/            # JSON schemas & validators
│   ├── servos/             # Servo modules (GPTO, AGCC, MIBI, etc.)
│   ├── governance/         # Approval & audit
│   ├── security/           # Security & fingerprinting
│   └── shared/             # Shared utilities/types
└── database/
    └── migrations/         # Database migrations
```

## Development Workflow

### Running Type Checks

```bash
# Check all packages
pnpm type-check

# Check specific package
pnpm --filter dashboard type-check
```

### Linting

```bash
# Lint all packages
pnpm lint

# Lint specific package
pnpm --filter dashboard lint
```

### Building for Production

```bash
# Build everything
pnpm build

# Build specific app
pnpm --filter dashboard build
```

## Troubleshooting

### Common Issues

1. **Module not found errors**
   - Run `pnpm install` to ensure all dependencies are installed
   - Check that workspace dependencies are properly linked

2. **TypeScript errors**
   - Run `pnpm type-check` to see all type errors
   - Ensure all workspace packages are built: `pnpm build`

3. **Build failures**
   - Clear `.next` directory: `rm -rf apps/dashboard/.next`
   - Clear node_modules: `rm -rf node_modules apps/*/node_modules packages/*/node_modules`
   - Reinstall: `pnpm install`

4. **Port already in use**
   - Change the port: `pnpm --filter dashboard dev -- -p 3001`
   - Or kill the process using port 3000

### Database Setup (Optional)

If you want to test with a real database:

1. Create a Neon PostgreSQL database
2. Update `.env` with your connection string
3. Run migrations:
   ```bash
   pnpm db:generate
   pnpm db:migrate
   ```

## Production Deployment

See `DEPLOYMENT.md` for Vercel deployment instructions.

## Next Steps

1. Visit `http://localhost:3000` to see the landing page
2. Navigate to `/dashboard` for the control panel
3. Check `/sites` to manage sites (requires authentication)
4. Try `/chat` for PantheraChat interface

## Support

For issues or questions, check:
- `README.md` - Project overview
- `DEPLOYMENT.md` - Deployment guide
- `TESTING.md` - Testing guide
- `IMPLEMENTATION_SUMMARY.md` - Complete feature list
