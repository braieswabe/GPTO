# GPTO Suite

A JSON Black Box runtime system that enables safe, declarative website updates, telemetry-driven optimization, and AI-powered orchestration through PantheraChat.

## Architecture

- **Frontend**: Next.js 14+ (App Router) deployed on Vercel
- **Backend**: Vercel Serverless Functions
- **Database**: Neon PostgreSQL (serverless)
- **CDN**: Vercel Edge Network (for Black Box runtime)

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 8+
- Vercel account
- Neon PostgreSQL account

### Setup

1. Clone the repository
2. Install dependencies: `pnpm install`
3. Copy `.env.example` to `.env` and fill in your credentials
4. Set up Vercel project and connect repository
5. Set up Neon database and configure connection string
6. Run migrations: `pnpm db:migrate`
7. Start development: `pnpm dev`

## Project Structure

```
GPTO/
├── apps/
│   ├── dashboard/          # Next.js dashboard app
│   └── black-box/          # Black Box runtime (CDN)
├── packages/
│   ├── api/                # Shared API utilities
│   ├── schemas/            # JSON schemas & validators
│   ├── telemetry/          # Telemetry processing
│   ├── governance/         # Approval & audit
│   ├── servos/             # Servo modules
│   └── shared/             # Shared utilities/types
└── database/
    └── migrations/         # Database migrations
```

## Development

- `pnpm dev` - Start development server
- `pnpm build` - Build all packages
- `pnpm lint` - Lint all packages
- `pnpm test` - Run tests
- `pnpm db:migrate` - Run database migrations

## Deployment

The project is configured for Vercel deployment. Push to main branch to trigger automatic deployment.

## License

Private - All Rights Reserved
