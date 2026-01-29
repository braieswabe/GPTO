# Telemetry Coverage Analysis - What Gets Logged

## ✅ Currently Logged and Recorded

### 1. **Page Views** ✅
**What's logged:**
- Every page load sends a `page_view` event
- Includes: URL, path, title, referrer
- Sent immediately on page load
- Also sent as heartbeat every 5 minutes (periodic telemetry by default, or heartbeat-only mode if periodic is disabled)
- Includes inferred `intent` and `funnelStage` in context for dashboard rollups

**Stored in dashboard:**
- `telemetry_events` table with `event_type: 'page_view'`
- Telemetry dashboard shows: Total visits, top pages, page view trends
- Used by all dashboards for analysis

### 2. **User Interactions** ✅
**What's logged:**
- Clicks (throttled to max 1 per second)
- Scrolls (throttled to max 1 per second)
- Sent as `interaction` events

**Stored in dashboard:**
- `telemetry_events` table with `event_type: 'interaction'`
- Telemetry dashboard shows: Total interactions, interaction trends
- Used by Confusion dashboard to detect dead ends and drop-offs

**Limitation:** Generic interactions only (not specific button/form tracking)

### 3. **Search Events** ✅
**What's logged:**
- Search queries (if search functionality triggers events)
- Sent as `search` events with query, results count, selected result

**Stored in dashboard:**
- `telemetry_events` table with `event_type: 'search'`
- Telemetry dashboard shows: Search intents, search trends
- Used by Confusion dashboard to detect repeated searches

**Note:** Accepts `sendTelemetry('search', { search: { query, results_count, selected_result } })` or `sendTelemetry('search', { query })` or `context.search_query`.

### 4. **Metrics (Every Event)** ✅
**What's logged:**
- Authority scores (`ts.authority`)
- Authority signals (`ai.authoritySignals`)
- Schema completeness (`ai.schemaCompleteness`)
- Structured data quality (`ai.structuredDataQuality`)
- Search visibility (`ai.searchVisibility`)
- All configured telemetry keys

**Stored in dashboard:**
- `telemetry_events.metrics` JSONB field
- Authority dashboard: Calculates averages, shows scores
- Schema dashboard: Shows completeness and quality scores
- All metrics calculated from current page state

### 5. **Periodic Telemetry (Every 5 Minutes)** ✅
**What's logged:**
- Aggregated page views, interactions, searches
- Confusion patterns (repeated searches, dead ends, drop-offs)
- Coverage data (content gaps, funnel stages, intent)
- Page metadata (H1/H2 counts, text length, JSON-LD presence)
- Sent as `custom` event with `periodic: true`

**Stored in dashboard:**
- `telemetry_events` table with `event_type: 'custom'` and `context.periodic: true`
- All dashboards use this data for analysis (periodic context is now consumed directly)
- Provides comprehensive snapshot every 5 minutes

### 6. **Content Inventory (Server-Side Crawl)** ✅
**What's logged:**
- All pages discovered from website crawl
- Page URLs, paths, titles
- Inferred intent and funnel stage
- Page metadata (H1/H2 counts, text length, JSON-LD)

**Stored in dashboard:**
- `content_inventory` table
- Coverage dashboard: Shows content gaps, missing funnel stages, missing intents
- Auto-crawled when missing or stale (>24 hours)

### 7. **Generated Signals** ✅
**What's logged:**
- Authority signals (from metrics analysis)
- Confusion signals (from event pattern analysis)
- Coverage signals (from content inventory analysis)

**Stored in dashboard:**
- `authoritySignals` table
- `confusionSignals` table
- `coverageSignals` table
- Auto-generated when dashboard loads (if missing)

## 📊 Dashboard Recording Summary

### Telemetry Dashboard
**Records:**
- ✅ Total visits (unique sessions)
- ✅ Total page views
- ✅ Total interactions
- ✅ Total searches
- ✅ Top pages (by view count)
- ✅ Top intents (from context, now included on page_view + periodic)
- ✅ Trends (vs previous period)

### Authority Dashboard
**Records:**
- ✅ Authority score (average from metrics)
- ✅ Authority signals score
- ✅ Schema completeness score
- ✅ Trust signals (from audits)
- ✅ Confidence gaps
- ✅ Blockers

### Confusion Dashboard
**Records:**
- ✅ Repeated searches (same query multiple times)
- ✅ Dead ends (pages with no navigation after threshold)
- ✅ Drop-offs (sessions with minimal activity)
- ✅ Intent mismatches (search intent vs page intent)

### Schema Dashboard
**Records:**
- ✅ Completeness score (from metrics)
- ✅ Quality score (from metrics)
- ✅ Missing schemas count
- ✅ Broken schemas count
- ✅ Available templates

### Coverage Dashboard
**Records:**
- ✅ Content gaps (missing what/who/how/trust sections)
- ✅ Missing funnel stages
- ✅ Missing intents
- ✅ Priority fixes (high severity gaps)

## ⚠️ What's NOT Currently Logged

### 1. **Specific Button Clicks**
- Current: Generic "interaction" events only
- Missing: Which buttons were clicked, form submissions, CTA clicks

### 2. **Time on Page**
- Current: Page views tracked, but not duration
- Missing: How long users spend on each page

### 3. **Exit Pages**
- Current: Page history tracked, but not exit analysis
- Missing: Which pages users leave from

### 4. **Conversion Events**
- Current: No conversion tracking
- Missing: Form submissions, sign-ups, purchases, etc.

### 5. **Custom Business Events**
- Current: Only standard events (page_view, interaction, search)
- Missing: Custom events like "demo_requested", "pricing_viewed", etc.

### 6. **Error Tracking**
- Current: No error logging
- Missing: JavaScript errors, 404s, failed requests

### 7. **Performance Metrics**
- Current: Basic performance metric placeholder
- Missing: Page load time, API response times, etc.

## 🎯 What Gets Recorded Automatically

### Real-Time Recording
1. **Every page load** → `page_view` event → Stored immediately
2. **Every click/scroll** → `interaction` event → Stored immediately (throttled)
3. **Every search** → `search` event → Stored immediately
4. **Every 5 minutes** → Periodic telemetry (default-on; heartbeat-only if periodic disabled) → Stored automatically

### Dashboard Recording
1. **On dashboard load** → Auto-generates signals if missing
2. **On dashboard load** → Auto-crawls content if missing/stale
3. **All events** → Stored in `telemetry_events` table
4. **All signals** → Stored in respective signal tables

## ✅ Answer: Yes, Most Results Are Logged

**What IS logged and recorded:**
- ✅ All page views
- ✅ All user interactions (clicks, scrolls)
- ✅ All searches
- ✅ All metrics (authority, schema, etc.)
- ✅ Periodic aggregated data
- ✅ Content inventory (from crawl)
- ✅ Generated signals (authority, confusion, coverage)

**What's displayed in dashboard:**
- ✅ Telemetry: Visits, page views, interactions, searches, trends
- ✅ Authority: Scores, signals, gaps, blockers
- ✅ Confusion: Repeated searches, dead ends, drop-offs
- ✅ Schema: Completeness, quality, missing/broken
- ✅ Coverage: Gaps, funnel stages, intents

**Limitations:**
- Generic interactions only (not specific button/form tracking)
- No time-on-page tracking
- No conversion event tracking
- No custom business events
- Session IDs rely on browser storage; if blocked, visits may approximate page views

## 🚀 Enhancement Opportunities

To log **everything**, you could add:

1. **Custom Event Tracking**
   ```typescript
   // In your website code
   window.PantheraBlackBox?.sendTelemetry('custom', {
     event_name: 'form_submitted',
     form_id: 'contact-form',
     // ... custom data
   });
   ```

2. **Time on Page**
   - Track page load time and unload time
   - Calculate duration

3. **Conversion Events**
   - Track specific conversion actions
   - Store in custom events

4. **Error Tracking**
   - Listen to `window.onerror`
   - Track 404s and failed requests

But for **standard website activity**, the current implementation logs and records:
- ✅ All page views
- ✅ All interactions
- ✅ All searches
- ✅ All metrics
- ✅ All aggregated data

**Result**: Yes, the changes will log and record all standard website results in the dashboard automatically! 🎉
