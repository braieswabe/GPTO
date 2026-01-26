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

- ✅ Injects JSON-LD schemas (Organization, Product, Service, FAQ, etc.)
- ✅ Builds authority signals through `sameAs` links and keywords
- ✅ Sends telemetry to track AI search visibility
- ✅ Ensures content is structured for AI model comprehension

## Usage

### Installation (npm, ESM-only)

```bash
npm install @careerdriver/black-box
```

```ts
import { PantheraBlackBox } from '@careerdriver/black-box';

const blackBox = new PantheraBlackBox({
  configUrl: 'https://api.example.com/api/sites/[site-id]/config',
  telemetryUrl: 'https://api.example.com/api/telemetry/events',
  siteId: 'your-site-id',
});

await blackBox.init();
```

### Installation (script tag, IIFE build for CDN)

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

### Manual Initialization

```javascript
const blackBox = new PantheraBlackBox({
  configUrl: 'https://api.example.com/api/sites/[site-id]/config',
  telemetryUrl: 'https://api.example.com/api/telemetry/events',
  siteId: 'your-site-id',
});

await blackBox.init();
```

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

## AI Search Optimization vs Traditional SEO

| Traditional SEO | GPTO (AI Search Optimization) |
|----------------|-------------------------------|
| Optimizes for Google/Bing | Optimizes for ChatGPT, Perplexity, Claude |
| HTML meta tags | JSON-LD structured data |
| Keywords & backlinks | Authority signals & trust graphs |
| PageRank algorithm | AI model comprehension |
| Human-readable content | AI-parseable structured data |
