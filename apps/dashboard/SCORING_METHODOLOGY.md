# Dashboard Scoring Methodology

This document explains how each score in the dashboard is calculated and what it means.

## Authority Score (0-100)

**Calculation:** Average of authority metrics from telemetry events

**Components:**
- **ts.authority** (40% weight): Trust signals authority score from telemetry metrics
  - Target: ≥0.6 (60/100)
  - Source: `telemetry_events.metrics['ts.authority']`
  
- **ai.authoritySignals** (30% weight): AI-detected authority signals and corroboration
  - Target: ≥0.6 (60/100)
  - Source: `telemetry_events.metrics['ai.authoritySignals']`
  
- **ai.schemaCompleteness** (30% weight): Structured data completeness affecting trust
  - Target: ≥0.6 (60/100)
  - Source: `telemetry_events.metrics['ai.schemaCompleteness']`

**Confidence Levels:**
- **High:** >500 events
- **Medium:** 100-500 events
- **Low:** 1-100 events
- **Unknown:** 0 events

**Common Blockers:**
- Authority signals below 0.6 indicate insufficient trust signals
- Insufficient corroboration across authoritative sources
- Schema completeness limiting trust lift

**API Endpoint:** `/api/dashboard/authority?siteId={id}&range=7d|30d`

---

## Confusion Signals (Count-based)

**Calculation:** Aggregate of user friction indicators

**Components:**
- **Repeated Searches:** Same query searched multiple times in one session
  - Lower is better
  - Detected by grouping events by `session_id` and counting duplicate `search.query` values
  
- **Dead Ends:** Page views with no follow-up event within 60 seconds
  - Lower is better
  - Threshold: 60,000ms (1 minute) gap after `page_view` event
  
- **Drop-offs:** Sessions with ≤2 events (very short sessions)
  - Lower is better
  - Indicates users leaving immediately
  
- **Intent Mismatches:** Telemetry intent differs from content inventory intent
  - Lower is better
  - Compares `telemetry_events.context.intent` vs `content_inventory.intent` for the same URL

**Confidence Levels:**
- **High:** >500 events
- **Medium:** 100-500 events
- **Low:** 1-100 events
- **Unknown:** 0 events

**API Endpoint:** `/api/dashboard/confusion?siteId={id}&range=7d|30d`

---

## Schema Completeness & Quality (0-100 each)

**Calculation:** Average of schema metrics from telemetry events

**Components:**
- **Completeness Score** (50% weight): Percentage of pages with structured data (JSON-LD)
  - Target: ≥0.76 (76/100)
  - Missing if <0.6
  - Source: `telemetry_events.metrics['ai.schemaCompleteness']`
  
- **Quality Score** (50% weight): Quality and correctness of structured data
  - Target: ≥0.6 (60/100)
  - Broken if <0.6
  - Source: `telemetry_events.metrics['ai.structuredDataQuality']`

**Available Templates:**
- Organization schema
- Product schema
- FAQ schema
- Service schema

**API Endpoint:** `/api/dashboard/schema?siteId={id}&range=7d|30d`

---

## Content Coverage (Count-based)

**Calculation:** Gap analysis from content inventory and audits

**Components:**
- **Content Gaps:** Missing content identified by audit answerability checks
  - Lower is better
  - Source: `site_audit.signals.answerability` gaps
  
- **Missing Funnel Stages:** Funnel stages (awareness, consideration, decision, retention) not covered
  - Lower is better
  - Detected by analyzing `content_inventory` for funnel stage coverage
  
- **Missing Intents:** User intents not matched to existing content
  - Lower is better
  - Compares telemetry intents vs content inventory intents
  
- **Priority Fixes:** High-severity gaps requiring immediate attention
  - Lower is better
  - Filtered from content gaps by severity

**Confidence Levels:**
- **High:** Audit + inventory data available
- **Medium:** Partial data available
- **Low:** Limited data
- **Unknown:** No data

**API Endpoint:** `/api/dashboard/coverage?siteId={id}&range=7d|30d`

---

## Telemetry Metrics (Count-based)

**Calculation:** Aggregate counts and trends from telemetry events

**Components:**
- **Visits:** Unique sessions (distinct `session_id` values)
  - Track trend over time
  - Source: `COUNT(DISTINCT session_id)` from `telemetry_events`
  
- **Page Views:** Total `page_view` events
  - Track trend over time
  - Source: `COUNT(*) WHERE event_type = 'page_view'`
  
- **Searches:** Total `search` events
  - Track trend over time
  - Source: `COUNT(*) WHERE event_type = 'search'`
  
- **Interactions:** Total `interaction` events
  - Track trend over time
  - Source: `COUNT(*) WHERE event_type = 'interaction'`

**Trend Calculation:** Compared to previous period (7d vs 7d before, or 30d vs 30d before)

**API Endpoint:** `/api/dashboard/telemetry?siteId={id}&range=7d|30d`

---

## Data Sources

All scores are calculated from:
- **Telemetry Events:** `telemetry_events` table with `event_type`, `session_id`, `page`, `search`, and `metrics` columns
- **Content Inventory:** `content_inventory` table with `url`, `intent`, and funnel stage data
- **Audits:** `audits` table with `results.siteAudit.signals` data
- **Signals:** `authority_signals`, `confusion_signals`, `coverage_signals` tables for cached rollups

## Refresh & Caching

- Scores can be refreshed on-demand with `?refresh=true` parameter
- Daily rollups are stored in `dashboard_rollups_daily` table
- Cron job runs at 2 AM daily to refresh all signals: `/api/cron/refresh-rollups`

## Client-Specific Reports

View detailed reports for a specific client/site at:
`/dashboard/reports/{siteId}`

This page shows:
- All scores filtered by site
- Executive summary insights
- Telemetry breakdown
- Export options
