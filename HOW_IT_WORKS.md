# How GPTO AI Search Optimization Works

## Executive Summary

GPTO (GPT Optimization Platform) is a comprehensive system designed to optimize websites specifically for **AI search engines** like ChatGPT, Perplexity, Claude, and other GPT-powered search tools. Unlike traditional SEO that optimizes for Google/Bing, GPTO focuses on making content easily discoverable, parseable, and trustworthy for AI models through structured data, authority signals, and factual accuracy indicators.

## Core Philosophy

AI models prioritize content based on:
1. **Structured Data Quality** - JSON-LD schemas that are easy to parse
2. **Authority Signals** - Trust graphs and partner relationships
3. **Factual Accuracy** - Content that is accurate, recent, and authoritative
4. **Semantic Structure** - Well-organized content with clear meaning

GPTO addresses all four of these factors through its integrated platform.

---

## System Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    GPTO Dashboard                            │
│  (Configuration Management, Audits, Analytics)              │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ Config API
                       │
┌──────────────────────▼──────────────────────────────────────┐
│              Black Box Runtime (Client-Side)                 │
│  • Schema Injection                                          │
│  • Authority Signal Building                                 │
│  • Telemetry Collection                                      │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ Telemetry
                       │
┌──────────────────────▼──────────────────────────────────────┐
│            Backend Services (Server-Side)                   │
│  • Audit Engine (AI Search Optimization Analysis)           │
│  • Authority Grove Engine                                    │
│  • TruthSeeker (Content Re-ranking)                         │
│  • Telemetry Processing                                     │
└─────────────────────────────────────────────────────────────┘
```

---

## Core Components

### 1. Black Box Runtime (`apps/black-box/`)

**Purpose**: Client-side JavaScript runtime that injects structured data and builds authority signals directly on websites.

**Key Features**:
- **JSON-LD Schema Injection**: Automatically injects Schema.org structured data
- **Authority Signal Building**: Incorporates Authority Grove data into schemas
- **Telemetry Collection**: Tracks AI search visibility metrics
- **Tier-Based Optimization**: Different schema sets for Bronze/Silver/Gold tiers

**How It Works**:

1. **Initialization**:
   ```javascript
   // Runtime loads configuration from GPTO dashboard API
   const config = await fetch(configUrl);
   // Initializes with site domain, brand, Authority Grove, etc.
   ```

2. **Schema Generation**:
   - **Bronze Tier**: Basic Organization schema with authority signals
   - **Silver/Gold Tier**: Additional Product, Service, FAQ, LocalBusiness schemas
   - All schemas include Authority Grove data (sameAs links, keywords, verticals)

3. **Schema Injection**:
   ```javascript
   // Injects JSON-LD schemas into <head>
   <script type="application/ld+json" data-panthera="true">
   {
     "@context": "https://schema.org",
     "@type": "Organization",
     "name": "Your Brand",
     "sameAs": ["https://twitter.com/...", "https://linkedin.com/..."],
     "keywords": ["industry", "keywords"]
   }
   </script>
   ```

4. **Telemetry Collection**:
   - Tracks page views, interactions
   - Sends AI search visibility metrics
   - Uses `navigator.sendBeacon` for reliability

**Safety**: No `eval()`, no `Function()`, only declarative JSON/DOM operations.

---

### 2. Audit Engine (`packages/audit/`)

**Purpose**: Analyzes websites for AI search optimization factors and provides actionable recommendations.

**AI Search Optimization Analysis** (`analyzeAISearchOptimization`):

The audit engine evaluates websites across 5 key dimensions (100 points total):

#### A. JSON-LD Schema Quality (30 points)
- **Presence Check**: Verifies JSON-LD schemas exist
- **Context Validation**: Ensures `@context: "https://schema.org"`
- **Type Validation**: Checks for valid `@type` declarations
- **Organization Schema**: Verifies Organization schema is present

**Scoring**:
- Base score: 10 points for having JSON-LD
- +10 points for valid Schema.org context
- +5 points for having @type declarations
- +5 points for Organization schema

#### B. Authority Signals (25 points)
- **sameAs Links**: Checks for social media/partner links in schemas
- **Authority Grove Configuration**: Verifies Authority Grove is set up
- **Keywords**: Checks for keyword configuration
- **Verticals**: Checks for vertical configuration

**Scoring**:
- +10 points for sameAs links in schemas
- +10 points for Authority Grove configuration
- +3 points for keywords
- +2 points for verticals

#### C. Structured Data Completeness (20 points)
- **Organization Schema**: Required for all tiers
- **Product/Service Schemas**: Required for Silver/Gold tiers
- **FAQ Schemas**: Optional but recommended

**Scoring**:
- +10 points for Organization schema
- +5 points for Product/Service schemas
- +5 points for FAQ schemas

#### D. Factual Accuracy Indicators (15 points)
- **H1 Heading**: Clear, descriptive main heading
- **Semantic Structure**: Proper H2/H3 hierarchy
- **Descriptive Content**: Sufficient paragraph content

**Scoring**:
- +5 points for H1 heading
- +5 points for semantic structure (H2+)
- +5 points for descriptive paragraphs

#### E. Traditional Elements (10 points)
- **Title Tag**: Optimized length (30-60 characters)
- **Meta Description**: Present and descriptive

**Scoring**:
- +5 points for optimized title tag
- +5 points for meta description

**Output**: Returns score (0-100), issues array, recommendations array, and detailed metrics.

---

### 3. Authority Grove (`packages/servos/gpto/src/authority-grove.ts`)

**Purpose**: Builds trust graphs and authority signals that AI models recognize.

**Components**:

1. **Authority Node**:
   ```typescript
   {
     id: "https://yourdomain.com",
     type: "Organization",
     name: "Your Brand",
     sameAs: ["https://twitter.com/...", "https://linkedin.com/..."],
     keywords: ["industry", "keywords"]
   }
   ```

2. **Partners**: List of partner organizations with weights
3. **Trust Edges**: Relationships between nodes with trust weights
4. **Corroboration**: Cross-references and validation sources

**Authority Score Calculation**:
```typescript
score = 0.5 (base)
  + (partner weights × 0.1)
  + (trust edge weights × 0.15)
  + (corroboration weights × 0.1)
```

**Schema Generation**: Converts Authority Grove data into JSON-LD Organization schema with:
- `sameAs` property (social profiles, partner sites)
- `keywords` property (industry keywords)
- `memberOf` property (partner relationships)

**API Endpoint**: `/api/servos/gpto/authority`
- `calculate_score`: Get authority score for a node
- `generate_backlinks`: Generate backlink plan
- `generate_schema`: Generate JSON-LD schema from Authority Grove

---

### 4. TruthSeeker (`packages/servos/gpto/src/truthseeker.ts`)

**Purpose**: Re-ranks content based on intent, authority, fairness, and recency to ensure AI models prioritize accurate, authoritative content.

**Scoring Factors**:

1. **Intent Match** (40% weight): How well content matches user query
2. **Anchor Match** (25% weight): URL/keyword relevance
3. **Authority** (15% weight): Source authority score
4. **Recency** (10% weight): Content freshness
5. **Fairness** (10% weight): Balanced representation

**Conflict Penalty**: Reduces score if multiple sources contradict

**Output**: Ranked content list with scores and explanations

**API Endpoint**: `/api/servos/gpto/truthseeker`
- Accepts content items and query
- Returns re-ranked list with scores

---

### 5. Telemetry System (`packages/schemas/src/telemetry-event.ts`)

**Purpose**: Tracks AI search visibility metrics and performance.

**Metrics Tracked**:

**Traditional Metrics**:
- `ts.intent`: Intent match score
- `ts.authority`: Authority score
- `ts.recency`: Recency score
- `ts.fairness`: Fairness score
- `entropy`: Content entropy
- `coherence`: Content coherence

**AI Search-Specific Metrics** (newly added):
- `ai.schemaCompleteness`: Schema completeness score (0-1)
- `ai.authoritySignals`: Authority signal strength (0-1)
- `ai.structuredDataQuality`: Structured data quality (0-1)
- `ai.searchVisibility`: Overall AI search visibility (0-1)

**Event Structure**:
```typescript
{
  schema: "panthera.blackbox.v1",
  tenant: "yourdomain.com",
  timestamp: "2024-01-01T00:00:00Z",
  source: "blackbox",
  context: {
    event_type: "page_view",
    url: "...",
    referrer: "..."
  },
  metrics: {
    "ai.schemaCompleteness": 0.85,
    "ai.authoritySignals": 0.72,
    "ai.structuredDataQuality": 0.90,
    "ai.searchVisibility": 0.82
  }
}
```

---

### 6. Dashboard (`apps/dashboard/`)

**Purpose**: Web interface for managing sites, configurations, audits, and analytics.

**Key Features**:

1. **Site Management**:
   - Add/edit sites
   - Configure Authority Grove
   - Set tier levels (Bronze/Silver/Gold)

2. **Configuration Management**:
   - JSON-based configuration editor
   - LLM-powered config revision (`/api/config/revise`)
   - Version control and rollback

3. **Audit Dashboard**:
   - Run technical audits
   - View AI Search Optimization scores
   - See recommendations and issues
   - Track improvements over time

4. **Analytics**:
   - AI Search Visibility score tracking
   - Schema completeness metrics
   - Authority signal strength
   - C-Suite dashboard for executives

5. **Metrics API**:
   - `/api/metrics/ai-search`: Calculate AI search visibility scores
   - Returns score, metrics, issues count, recommendations count

---

## Complete Workflow

### 1. Setup Phase

**Step 1: Install Black Box**
```html
<!-- Add script tag to website -->
<script
  src="https://gpto-dashboard.vercel.app/black-box.js"
  data-config-url="https://api.gpto.com/api/sites/[site-id]/config"
  data-telemetry-url="https://api.gpto.com/api/telemetry/events"
  data-site-id="your-site-id"
  async
></script>
```

**Step 2: Configure in Dashboard**
- Add site to GPTO dashboard
- Configure Authority Grove (keywords, verticals, partners, sameAs links)
- Set tier level (Bronze/Silver/Gold)
- Configure products/services/FAQs (for Silver/Gold)

### 2. Runtime Phase

**Step 1: Black Box Initialization**
1. Runtime loads configuration from API
2. Validates configuration structure
3. Applies configuration to page

**Step 2: Schema Injection**
1. Generates schemas based on tier:
   - Bronze: Organization schema
   - Silver/Gold: Organization + Product/Service/FAQ schemas
2. Incorporates Authority Grove data:
   - Adds `sameAs` links
   - Adds `keywords` property
   - Adds partner relationships
3. Injects JSON-LD scripts into `<head>`

**Step 3: Telemetry Collection**
1. Sends initial page view event
2. Tracks user interactions (clicks, scrolls)
3. Collects AI search visibility metrics
4. Sends telemetry to backend

### 3. Analysis Phase

**Step 1: Run Audit**
- Dashboard triggers technical audit
- Audit engine fetches site HTML
- Analyzes AI search optimization factors
- Calculates scores and metrics

**Step 2: Generate Recommendations**
- Categorizes issues by priority (critical/high/medium/low)
- Provides actionable recommendations
- Links to Authority Grove setup if needed
- Suggests schema improvements

**Step 3: Track Metrics**
- Dashboard displays AI Search Visibility score
- Shows schema completeness metrics
- Tracks authority signal strength
- Monitors improvements over time

### 4. Optimization Phase

**Step 1: Address Recommendations**
- Configure Authority Grove if missing
- Add missing schemas
- Improve structured data quality
- Enhance content structure

**Step 2: Re-run Audit**
- Verify improvements
- Track score changes
- Monitor metrics

**Step 3: Continuous Optimization**
- Regular audits (monthly recommended)
- Monitor telemetry data
- Adjust Authority Grove as needed
- Update schemas for new content

---

## How It Improves AI Search Optimization

### 1. Structured Data for AI Parsing

**Problem**: AI models need structured data to understand content efficiently.

**Solution**: GPTO injects JSON-LD schemas with:
- Valid Schema.org context
- Proper @type declarations
- Complete property sets
- Tier-appropriate schema types

**Impact**: AI models can parse and understand content without complex HTML parsing.

### 2. Authority Signals for Trust

**Problem**: AI models prioritize authoritative sources.

**Solution**: Authority Grove builds trust signals through:
- `sameAs` links (social profiles, partner sites)
- Keywords and verticals
- Partner network relationships
- Trust edge weights

**Impact**: AI models recognize your site as authoritative and prioritize it in search results.

### 3. Factual Accuracy Indicators

**Problem**: AI models prioritize accurate, recent content.

**Solution**: TruthSeeker ensures:
- Content matches user intent
- Sources are authoritative
- Information is recent
- Content is fair and balanced

**Impact**: Your content ranks higher in AI search results for relevant queries.

### 4. Comprehensive Auditing

**Problem**: Hard to know what needs improvement.

**Solution**: Audit engine provides:
- Detailed AI Search Optimization scores
- Specific issues and recommendations
- Metrics for each optimization factor
- Trackable improvements over time

**Impact**: Clear roadmap for optimization with measurable results.

### 5. Telemetry-Driven Insights

**Problem**: No visibility into AI search performance.

**Solution**: Telemetry tracks:
- AI search visibility scores
- Schema completeness metrics
- Authority signal strength
- Structured data quality

**Impact**: Data-driven optimization based on real AI search behavior.

---

## Technical Implementation Details

### Schema Injection Process

```typescript
// 1. Generate schemas based on tier
const schemas = generateSchemasForTier(config, tier);

// 2. Base Organization schema (all tiers)
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": config.site.brand,
  "url": `https://${config.site.domain}`,
  "sameAs": config.authority_grove?.node?.sameAs || [],
  "keywords": config.authority_grove?.node?.keywords || []
}

// 3. Additional schemas for Silver/Gold
if (tier === 'silver' || tier === 'gold') {
  // Product schemas
  // Service schemas
  // FAQ schemas
  // LocalBusiness schemas
}

// 4. Inject into <head>
schemas.forEach(schema => {
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(schema);
  document.head.appendChild(script);
});
```

### Audit Scoring Algorithm

```typescript
// AI Search Optimization Score (0-100)
score = 
  schemaQuality (0-30) +
  authoritySignals (0-25) +
  structuredDataCompleteness (0-20) +
  factualAccuracy (0-15) +
  traditionalElements (0-10)

// Each component has detailed sub-scoring
schemaQuality = 
  hasJSONLD ? 10 : 0 +
  hasValidContext ? 10 : 0 +
  hasTypes ? 5 : 0 +
  hasOrganization ? 5 : 0
```

### Authority Score Calculation

```typescript
authorityScore = 0.5 (base)
  + sum(partner.weight × 0.1)
  + sum(trustEdge.weight × 0.15 where edge.to === nodeId)
  + sum(corroboration.weight × 0.1 where corr.target === nodeId)

// Capped at 1.0
authorityScore = Math.min(1.0, authorityScore)
```

---

## Integration Points

### 1. Black Box ↔ Dashboard API
- **Config Endpoint**: `/api/sites/[id]/config`
- **Telemetry Endpoint**: `/api/telemetry/events`
- **Metrics Endpoint**: `/api/metrics/ai-search`

### 2. Dashboard ↔ Audit Engine
- **Audit Trigger**: `runTechnicalAudit(siteId)`
- **Results**: `TechnicalAuditResult` with `aiSearchOptimization` field

### 3. Dashboard ↔ Authority Grove
- **API**: `/api/servos/gpto/authority`
- **Actions**: `calculate_score`, `generate_backlinks`, `generate_schema`

### 4. Dashboard ↔ TruthSeeker
- **API**: `/api/servos/gpto/truthseeker`
- **Input**: Content items, query, config
- **Output**: Re-ranked content with scores

---

## Best Practices

### 1. Complete Authority Grove Setup
- Configure all fields (keywords, verticals, partners)
- Add sameAs links for all social profiles
- Build partner relationships
- Regularly update trust edges

### 2. Tier-Appropriate Schemas
- Bronze: Focus on Organization schema
- Silver: Add Product/Service schemas
- Gold: Full schema deployment with dynamic schemas

### 3. Regular Audits
- Run audits monthly
- Address critical issues immediately
- Track improvements over time
- Use recommendations as optimization roadmap

### 4. Monitor Telemetry
- Track AI search visibility scores
- Monitor schema completeness
- Watch authority signal strength
- Use data to guide optimization

### 5. Content Quality
- Ensure factual accuracy
- Keep content recent
- Use clear semantic structure
- Provide descriptive content

---

## Success Metrics

### AI Search Visibility Score
- **80-100**: Excellent visibility
- **60-79**: Good visibility, minor improvements needed
- **40-59**: Moderate visibility, significant improvements needed
- **0-39**: Poor visibility, critical issues

### Schema Completeness
- **0.9-1.0**: Complete schema deployment
- **0.7-0.9**: Good schema coverage
- **0.4-0.6**: Basic schemas present, incomplete
- **0.0-0.3**: Missing critical schemas

### Authority Signal Strength
- **0.9-1.0**: Maximum authority signals
- **0.7-0.9**: Strong authority signals
- **0.4-0.6**: Moderate authority signals
- **0.0-0.3**: Weak authority signals

---

## Conclusion

GPTO provides a comprehensive, end-to-end solution for optimizing websites for AI search engines. Through structured data injection, authority signal building, factual accuracy scoring, and comprehensive auditing, GPTO ensures your content is discoverable, parseable, and trustworthy for AI models.

The system is designed to be:
- **Safe**: No code execution, only declarative operations
- **Effective**: Addresses all key factors AI models consider
- **Measurable**: Provides detailed metrics and recommendations
- **Scalable**: Works for sites of any size
- **Maintainable**: JSON-based configuration, easy to update

By following the workflow and best practices outlined in this document, websites can significantly improve their visibility in AI search results.
