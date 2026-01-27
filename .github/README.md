# GPTO Suite

**GPT Optimization Platform** - Optimize your website for AI search engines (ChatGPT, Perplexity, Claude, and other GPT-powered search tools).

## 🚀 What's New in v1.1.0

- ✅ **Automatic Server-Side Schema Injection** - Schemas visible to external audit tools
- ✅ **Zero Manual HTML Edits** - All schema injection is automatic
- ✅ **Automatic Updates** - Schemas update when configuration changes
- ✅ **Telemetry-Driven Improvements** - Optimizes based on real data

## Quick Start

### Installation

```bash
npm install @careerdriver/black-box
# or
pnpm add @careerdriver/black-box
```

### Usage

**Client-Side (Script Tag):**
```html
<script
  src="https://gpto-dashboard.vercel.app/black-box.js"
  data-config-url="https://gpto-dashboard.vercel.app/api/sites/[site-id]/config"
  data-telemetry-url="https://gpto-dashboard.vercel.app/api/telemetry/events"
  data-site-id="your-site-id"
  async
></script>
```

**Server-Side Schema Injection (Recommended):**
```tsx
// Next.js / React
const schemas = await fetch(
  `https://gpto-dashboard.vercel.app/api/sites/${siteId}/render`
);
const schemaHTML = await schemas.text();

<div dangerouslySetInnerHTML={{ __html: schemaHTML }} />
```

## Features

- **Automatic JSON-LD Schema Injection** - Client-side and server-side
- **Authority Grove** - Trust signals and partner networks
- **TruthSeeker** - Factual accuracy scoring
- **Telemetry Analytics** - Track AI search visibility
- **Automatic Updates** - No manual HTML edits needed

## Documentation

- [Installation Guide](./INSTALLATION_UPDATED.md)
- [Automatic Schema Injection](./AUTOMATIC_SCHEMA_INJECTION.md)
- [Configuration Samples](./samples/README.md)
- [How It Works](./HOW_IT_WORKS.md)
- [CHANGELOG](./CHANGELOG.md)

## License

Private - All Rights Reserved
