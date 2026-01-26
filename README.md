# GPTO Suite

**GPT Optimization Platform** - Optimize your website for AI search engines (ChatGPT, Perplexity, Claude, and other GPT-powered search tools). GPTO makes your website more discoverable, accessible, and visible in AI search results through structured data, authority signals, and AI-friendly configuration.

A JSON Black Box runtime system that enables safe, declarative website updates, AI search optimization, telemetry-driven insights, and AI-powered orchestration through PantheraChat.

## What is GPTO?

**GPTO (GPT Optimization)** is the next evolution of SEO - optimized specifically for AI search engines. While traditional SEO focuses on ranking in Google/Bing, GPTO optimizes your website for:

- **ChatGPT** - OpenAI's conversational search
- **Perplexity** - AI-powered search engine
- **Claude** - Anthropic's AI assistant
- **Other GPT-powered search tools**

### How GPTO Works

1. **Structured Data Injection** - Injects JSON-LD schemas that AI models can easily parse and understand
2. **Authority Signals** - Builds trust graphs and authority signals that AI models recognize
3. **Factual Accuracy** - Ensures content is accurate and authoritative (AI models prioritize truth)
4. **Telemetry Tracking** - Monitors AI search visibility and optimizes based on real AI behavior
5. **Declarative Configuration** - JSON-based configuration that AI models can understand

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
│   └── black-box/          # Black Box runtime (CDN) - AI search optimization runtime
├── packages/
│   ├── api/                # Shared API utilities
│   ├── schemas/            # JSON schemas & validators
│   ├── telemetry/          # Telemetry processing (AI search visibility tracking)
│   ├── governance/         # Approval & audit
│   ├── servos/             # Servo modules
│   │   ├── gpto/          # Core AI search optimization engine
│   │   ├── agcc/          # AI content generation
│   │   └── mibi/          # Market & Business Intelligence
│   └── shared/             # Shared utilities/types
└── database/
    └── migrations/         # Database migrations
```

## Key Features

### AI Search Optimization
- **JSON-LD Schema Injection** - Structured data for AI model comprehension
- **Authority Grove** - Trust signals and partner networks for AI recognition
- **TruthSeeker** - Factual accuracy scoring for AI model prioritization
- **Telemetry Analytics** - Track AI search visibility and performance

### Safe Configuration Management
- **No-code Updates** - Update websites via JSON configuration
- **Governed Changes** - Approval workflows and audit trails
- **Rollback Support** - Revert changes instantly
- **Telemetry-Driven** - Optimize based on real AI search data

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
