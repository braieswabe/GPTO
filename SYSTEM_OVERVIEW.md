# GPTO System Overview - Quick Reference

## What GPTO Does

GPTO optimizes websites for **AI search engines** (ChatGPT, Perplexity, Claude) by:
1. Injecting JSON-LD structured data that AI models can parse
2. Building authority signals through Authority Grove
3. Ensuring factual accuracy with TruthSeeker
4. Tracking AI search visibility through telemetry
5. Providing actionable recommendations through audits

## Key Components

| Component | Purpose | Location |
|-----------|---------|----------|
| **Black Box Runtime** | Client-side schema injection | `apps/black-box/` |
| **Audit Engine** | AI search optimization analysis | `packages/audit/` |
| **Authority Grove** | Trust signal building | `packages/servos/gpto/authority-grove.ts` |
| **TruthSeeker** | Content re-ranking | `packages/servos/gpto/truthseeker.ts` |
| **Dashboard** | Management interface | `apps/dashboard/` |
| **Telemetry** | Metrics tracking | `packages/schemas/telemetry-event.ts` |

## How It Works (Simple Flow)

```
1. Install Black Box → 2. Configure Authority Grove → 3. Schemas Injected → 4. AI Models Parse → 5. Higher Visibility
```

## Installation

### Script Tag (CDN)
```html
<script
  src="https://gpto-dashboard.vercel.app/black-box.js"
  data-config-url="https://api.gpto.com/api/sites/[site-id]/config"
  data-telemetry-url="https://api.gpto.com/api/telemetry/events"
  data-site-id="your-site-id"
  async
></script>
```

### NPM Package
```bash
npm install @careerdriver/black-box
```

## Configuration

### Authority Grove Setup
```json
{
  "panthera_blackbox": {
    "authority_grove": {
      "node": {
        "id": "https://yourdomain.com",
        "name": "Your Brand",
        "sameAs": ["https://twitter.com/...", "https://linkedin.com/..."],
        "keywords": ["industry", "keywords"]
      },
      "partners": [...],
      "trustEdges": [...]
    }
  }
}
```

## AI Search Optimization Score

**Scoring Breakdown (100 points total)**:
- Schema Quality: 30 points
- Authority Signals: 25 points
- Structured Data Completeness: 20 points
- Factual Accuracy: 15 points
- Traditional Elements: 10 points

**Score Interpretation**:
- 80-100: Excellent visibility
- 60-79: Good visibility
- 40-59: Moderate visibility
- 0-39: Poor visibility

## API Endpoints

| Endpoint | Purpose |
|----------|---------|
| `/api/sites/[id]/config` | Get site configuration |
| `/api/metrics/ai-search?siteId=X` | Get AI search visibility score |
| `/api/servos/gpto/authority` | Authority Grove operations |
| `/api/servos/gpto/truthseeker` | Content re-ranking |

## Tier Features

| Tier | Schemas | Features |
|------|---------|----------|
| **Bronze** | Organization | Basic schema + authority signals |
| **Silver** | Organization + Product/Service | Full schema deployment |
| **Gold** | All schemas + Dynamic | Dynamic schemas + C-suite dashboard |

## Key Metrics

- `ai.schemaCompleteness`: Schema completeness (0-1)
- `ai.authoritySignals`: Authority signal strength (0-1)
- `ai.structuredDataQuality`: Structured data quality (0-1)
- `ai.searchVisibility`: Overall AI search visibility (0-1)

## Best Practices

1. ✅ Complete Authority Grove setup
2. ✅ Use tier-appropriate schemas
3. ✅ Run regular audits (monthly)
4. ✅ Monitor telemetry metrics
5. ✅ Address recommendations promptly

## Documentation

- **[HOW_IT_WORKS.md](./HOW_IT_WORKS.md)**: Comprehensive technical documentation
- **[AI_SEARCH_OPTIMIZATION.md](./AI_SEARCH_OPTIMIZATION.md)**: Best practices guide
- **[BLACK_BOX_INSTALLATION.md](./BLACK_BOX_INSTALLATION.md)**: Installation instructions

## Support

For questions or issues:
- Check troubleshooting sections in documentation
- Review audit recommendations in dashboard
- Consult technical documentation
- Contact support for Gold tier users
