# Panthera Black Box Runtime

**AI Search Optimization Runtime** - Minimal JavaScript runtime (<10KB gzipped) that optimizes websites for AI search engines by injecting structured data (JSON-LD schemas), building authority signals, and enabling AI model comprehension.

## Purpose

The Black Box runtime optimizes websites specifically for **AI search engines** (ChatGPT, Perplexity, Claude, etc.) by:

1. **Injecting JSON-LD Structured Data** - Makes content easily parseable by AI models
2. **Building Authority Signals** - Creates trust graphs through Authority Grove
3. **Ensuring Factual Accuracy** - Uses TruthSeeker to ensure AI models prioritize your content
4. **Tracking AI Visibility** - Sends telemetry to measure AI search performance

## Safety

- **No eval()** - No code execution
- **No Function()** - No dynamic function creation
- **Declarative only** - All operations are safe JSON/DOM manipulations
- **Fail-safe** - Never breaks the host site

## How It Works

The runtime reads JSON configuration from your GPTO dashboard and automatically:

- ✅ Injects JSON-LD schemas (Organization, Product, Service, FAQ, etc.) **client-side**
- ✅ **Server-side schema injection** available for external audit tool visibility
- ✅ Builds authority signals through `sameAs` links and keywords
- ✅ Sends telemetry to track AI search visibility
- ✅ **Periodic telemetry** sends comprehensive metrics every 5 minutes for real-time dashboard updates
- ✅ Ensures content is structured for AI model comprehension
- ✅ **Automatically updates** schemas when configuration changes
- ✅ **Telemetry-driven improvements** optimize schemas over time

## Usage

### Installation

#### Using pnpm (Recommended)

```bash
# Install as a dependency
pnpm add @careerdriver/black-box

# Install as a dev dependency
pnpm add -D @careerdriver/black-box

# Install specific version
pnpm add @careerdriver/black-box@1.2.0

# Install latest version (includes periodic telemetry)
pnpm add @careerdriver/black-box@latest
```

**Note:** v1.2.0+ includes periodic telemetry for real-time dashboard updates. See [Periodic Telemetry Guide](./PERIODIC_TELEMETRY.md) for details.

#### Using npm

```bash
# Install latest version (includes periodic telemetry)
npm install @careerdriver/black-box@latest

# Install specific version
npm install @careerdriver/black-box@1.2.0
```

#### Using yarn

```bash
# Install latest version (includes periodic telemetry)
yarn add @careerdriver/black-box@latest

# Install specific version
yarn add @careerdriver/black-box@1.2.0
```

### ESM Import Usage

```ts
import { PantheraBlackBox } from '@careerdriver/black-box';

const blackBox = new PantheraBlackBox({
  configUrl: 'https://api.example.com/api/sites/[site-id]/config',
  telemetryUrl: 'https://api.example.com/api/telemetry/events',
  siteId: 'your-site-id',
});

await blackBox.init();
```

### Browser Usage (Script Tag / CDN)

#### Via unpkg CDN

Add the script tag to your HTML:

```html
<script
  src="https://unpkg.com/@careerdriver/black-box@latest/dist/runtime.global.js"
  data-config-url="https://api.example.com/api/sites/[site-id]/config"
  data-telemetry-url="https://api.example.com/api/telemetry/events"
  data-site-id="your-site-id"
  async
></script>
```

**Note:** The `@latest` version includes periodic telemetry (v1.2.0+). To use a specific version, replace `@latest` with `@1.2.0` or your preferred version.

#### Via Local Installation

If you've installed via pnpm/npm, reference the local file:

```html
<script
  src="./node_modules/@careerdriver/black-box/dist/runtime.global.js"
  data-config-url="https://api.example.com/api/sites/[site-id]/config"
  data-telemetry-url="https://api.example.com/api/telemetry/events"
  data-site-id="your-site-id"
  async
></script>
```

### Manual Initialization

```javascript
const blackBox = new PantheraBlackBox({
  configUrl: 'https://api.example.com/api/sites/[site-id]/config',
  telemetryUrl: 'https://api.example.com/api/telemetry/events',
  siteId: 'your-site-id',
});

await blackBox.init();
```

### Server-Side Schema Injection (Recommended for External Audit Tools)

For optimal visibility with external audit tools that don't execute JavaScript, you can automatically inject schemas server-side:

#### Option 1: Schema Render Endpoint

Fetch schemas and inject into your HTML template:

```typescript
// Next.js / React Server Component
async function getSchemas(siteId: string) {
  const response = await fetch(`https://gpto-dashboard.vercel.app/api/sites/${siteId}/render`);
  return await response.text();
}

export default async function Page() {
  const schemaScripts = await getSchemas('your-site-id');
  
  return (
    <html>
      <head>
        <div dangerouslySetInnerHTML={{ __html: schemaScripts }} />
      </head>
      <body>{/* Your content */}</body>
    </html>
  );
}
```

#### Option 2: Proxy Endpoint

Use the proxy endpoint for external audit tools:

```
https://gpto-dashboard.vercel.app/api/sites/[site-id]/proxy?url=https://your-domain.com
```

This automatically serves your page with schemas injected server-side.

#### Option 3: Server-Side Utility

Import and use the schema generator directly:

```typescript
import { generateSchemaScriptTags, injectSchemasIntoHTML } from '@gpto/servos/gpto';

// Generate schema script tags
const schemaScripts = generateSchemaScriptTags(config.panthera_blackbox);

// Or inject into existing HTML
const htmlWithSchemas = injectSchemasIntoHTML(html, config.panthera_blackbox);
```

**Benefits:**
- ✅ Schemas visible to external audit tools
- ✅ Automatic updates when config changes
- ✅ No manual HTML edits required
- ✅ Works alongside client-side Black Box injection

## AI Search Optimization Features

### JSON-LD Schema Injection
Automatically injects structured data that AI models can parse:
- Organization schema with authority signals
- Product/Service schemas (Silver/Gold tiers)
- FAQ schemas for question-answer pairs
- LocalBusiness schemas for geo-targeting

### Authority Grove Integration
Builds trust signals through:
- `sameAs` links (social profiles, other domains)
- Keywords and verticals
- Partner network relationships

### TruthSeeker Integration
Ensures content is:
- Factually accurate
- Authoritative
- Fair and unbiased

### Periodic Telemetry (v1.2.0+)
Automatically sends comprehensive metrics to the GPTO dashboard every 5 minutes:

**Features:**
- **Real-time Dashboard Updates**: Populates telemetry, confusion, authority, schema, and coverage metrics
- **Comprehensive Metrics**: Collects real metrics from page state (JSON-LD schemas, authority signals, content gaps)
- **Confusion Detection**: Tracks repeated searches, dead ends, and drop-offs
- **Coverage Analysis**: Detects content gaps, funnel stages, and intent mismatches
- **Configurable Interval**: Default 5 minutes, customizable via config

**Enable Periodic Telemetry:**

Add to your site configuration in the GPTO dashboard:

```json
{
  "panthera_blackbox": {
    "telemetry": {
      "emit": true,
      "keys": [
        "ts.authority",
        "ai.schemaCompleteness",
        "ai.structuredDataQuality",
        "ai.authoritySignals",
        "ai.searchVisibility"
      ],
      "periodic": {
        "enabled": true,
        "intervalMs": 300000
      }
    }
  }
}
```

**What Gets Sent:**
- Page views, interactions, and searches (aggregated counts)
- Schema completeness and quality scores
- Authority and trust signals
- Confusion patterns (repeated searches, dead ends, drop-offs)
- Content gaps and funnel stage detection
- Intent detection and coverage analysis

**Dashboard Integration:**
All periodic telemetry data automatically populates:
- Telemetry dashboard (views, visits, top pages)
- Confusion dashboard (dead ends, repeated searches)
- Authority dashboard (trust scores, confidence gaps)
- Schema dashboard (completeness, quality)
- Coverage dashboard (content gaps, missing stages)
- Business Brief (executive insights)
- Pulse Cards (revenue impact, experience health, trust lift, coverage risk)
- Recent and relevant

## Build

```bash
pnpm build
```

Output:
- `dist/runtime.js` (ESM)
- `dist/runtime.global.js` (IIFE for script tag)
- `dist/runtime.d.ts` (types)

## Deployment

Deploy to Vercel CDN for global distribution. The file should be served with appropriate cache headers.

## Version

**Current Version:** `1.2.0`

### What's New in v1.2.0

- ✅ **Periodic Telemetry**: Automatic comprehensive metrics collection every 5 minutes
- ✅ **Real-time Dashboard Updates**: Populates all dashboard sections with live data
- ✅ **Enhanced Metrics Collection**: Real metrics from page state (not random values)
- ✅ **Confusion Detection**: Tracks repeated searches, dead ends, drop-offs
- ✅ **Coverage Analysis**: Detects content gaps, funnel stages, intent mismatches
- ✅ **Configurable Interval**: Customize periodic telemetry interval

### Previous Features (v1.1.0)

- ✅ Automatic server-side schema injection
- ✅ Zero manual HTML edits required
- ✅ Automatic schema updates when config changes
- ✅ External audit tool visibility
- ✅ Multiple integration options

See [CHANGELOG.md](../../CHANGELOG.md) for complete release notes.

## AI Search Optimization vs Traditional SEO

| Traditional SEO | GPTO (AI Search Optimization) |
|----------------|-------------------------------|
| Optimizes for Google/Bing | Optimizes for ChatGPT, Perplexity, Claude |
| HTML meta tags | JSON-LD structured data |
| Keywords & backlinks | Authority signals & trust graphs |
| PageRank algorithm | AI model comprehension |
| Human-readable content | AI-parseable structured data |
