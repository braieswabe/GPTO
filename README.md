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

1. **Automatic Structured Data Injection** - Injects JSON-LD schemas client-side and server-side automatically
2. **Server-Side Schema Rendering** - Makes schemas visible to external audit tools without manual HTML edits
3. **Authority Signals** - Builds trust graphs and authority signals that AI models recognize
4. **Factual Accuracy** - Ensures content is accurate and authoritative (AI models prioritize truth)
5. **Telemetry Tracking** - Monitors AI search visibility and optimizes based on real AI behavior
6. **Automatic Updates** - Schemas update automatically when configuration changes
7. **Declarative Configuration** - JSON-based configuration that AI models can understand

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
- **Automatic JSON-LD Schema Injection** - Client-side and server-side schema injection
- **Server-Side Schema Rendering** - Schemas visible to external audit tools automatically
- **Authority Grove** - Trust signals and partner networks for AI recognition
- **TruthSeeker** - Factual accuracy scoring for AI model prioritization
- **Telemetry Analytics** - Track AI search visibility and performance
- **Automatic Updates** - Schemas update automatically when configuration changes

### Safe Configuration Management
- **No-code Updates** - Update websites via JSON configuration
- **Governed Changes** - Approval workflows and audit trails
- **Rollback Support** - Revert changes instantly
- **Telemetry-Driven** - Optimize based on real AI search data
- **Zero Manual HTML Edits** - All schema injection is automatic

## Development

- `pnpm dev` - Start development server
- `pnpm build` - Build all packages
- `pnpm lint` - Lint all packages
- `pnpm test` - Run tests
- `pnpm db:migrate` - Run database migrations

## Deployment

The project is configured for Vercel deployment. Push to main branch to trigger automatic deployment.

## Installation Methods

### Method 1: Script Tag (CDN)
Quickest setup - add script tag to HTML. See [Installation Guide](./INSTALLATION_UPDATED.md).

### Method 2: Server-Side + Client-Side (Recommended)
Best for external audit tool visibility. See [Automatic Schema Injection](./AUTOMATIC_SCHEMA_INJECTION.md).

### Method 3: NPM Package
```bash
npm install @careerdriver/black-box
```

## Recent Updates (v1.1.0)

- ✅ **Automatic Server-Side Schema Injection** - Schemas visible to external audit tools
- ✅ **Zero Manual HTML Edits** - All schema injection is automatic
- ✅ **Automatic Updates** - Schemas update when configuration changes
- ✅ **Telemetry-Driven Improvements** - Optimizes based on real data
- ✅ **Multiple Integration Options** - Render endpoint, Proxy, or Utility functions

See [CHANGELOG.md](./CHANGELOG.md) for complete release notes.

## Documentation

- [Installation Guide](./INSTALLATION_UPDATED.md) - Complete installation instructions
- [Automatic Schema Injection](./AUTOMATIC_SCHEMA_INJECTION.md) - Server-side injection guide
- [Configuration Samples](./samples/README.md) - Example configurations
- [How It Works](./HOW_IT_WORKS.md) - Technical documentation
- [AI Search Optimization](./AI_SEARCH_OPTIMIZATION.md) - Best practices

## License

Private - All Rights Reserved
