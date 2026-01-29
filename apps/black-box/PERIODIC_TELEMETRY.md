# Periodic Telemetry Integration Guide

## Overview

The Black Box runtime (v1.2.0+) includes periodic telemetry that automatically sends comprehensive metrics to the GPTO dashboard every 5 minutes. This ensures your dashboard is always up-to-date with real-time data.

## How It Works

### Data Flow

```
Black Box Runtime (Client)
  ↓ Every 5 minutes
Collects Metrics from Page State
  ↓
Detects Confusion Patterns
  ↓
Analyzes Coverage Gaps
  ↓
Sends Two Events:
  1. Custom event (comprehensive context)
  2. Page_view event (heartbeat for counting)
  ↓
GPTO Dashboard API (/api/telemetry/events)
  ↓
Stores in telemetry_events table
  ↓
Dashboard APIs Process Data
  ↓
Dashboard UI Updates
```

### What Gets Sent

#### 1. Custom Event (event_type: 'custom')
Contains comprehensive context data:

```json
{
  "schema": "panthera.blackbox.v1",
  "tenant": "example.com",
  "timestamp": "2026-01-29T22:20:00.000Z",
  "source": "blackbox",
  "event_type": "custom",
  "session_id": "uuid-here",
  "page": {
    "url": "https://example.com/page",
    "path": "/page",
    "title": "Page Title"
  },
  "context": {
    "periodic": true,
    "timeSinceLastSend": 300000,
    "aggregated": {
      "pageViews": 5,
      "interactions": 12,
      "searches": 2
    },
    "confusion": {
      "repeatedSearches": 1,
      "deadEnds": 2,
      "dropOffs": 0,
      "repeatedSearchesDetail": [...],
      "deadEndsDetail": [...],
      "dropOffsDetail": [...]
    },
    "coverage": {
      "contentGaps": 2,
      "contentGapsDetail": ["what", "how"],
      "funnelStage": "awareness",
      "intent": "general",
      "pageMetadata": {
        "hasJsonLd": true,
        "h1Count": 1,
        "h2Count": 5,
        "textLength": 2500
      }
    },
    "intent": "general",
    "funnelStage": "awareness"
  },
  "metrics": {
    "ts.authority": 0.75,
    "ai.schemaCompleteness": 0.85,
    "ai.structuredDataQuality": 0.80,
    "ai.authoritySignals": 0.70,
    "ai.searchVisibility": 0.90
  }
}
```

#### 2. Page View Event (event_type: 'page_view')
Heartbeat event for telemetry counting:

```json
{
  "schema": "panthera.blackbox.v1",
  "tenant": "example.com",
  "timestamp": "2026-01-29T22:20:00.000Z",
  "source": "blackbox",
  "event_type": "page_view",
  "session_id": "uuid-here",
  "page": {
    "url": "https://example.com/page",
    "path": "/page",
    "title": "Page Title"
  },
  "context": {
    "periodic": true,
    "heartbeat": true,
    "aggregatedMetrics": {...}
  },
  "metrics": {...}
}
```

## Dashboard Integration

### Telemetry Dashboard (`/api/dashboard/telemetry`)

**Data Sources:**
- `page_view` events → Counts page views
- `context.aggregated.pageViews` → Aggregated counts
- `page.url` → Top pages

**What Gets Displayed:**
- Total visits (unique sessions)
- Page views count
- Top pages
- Search intents
- Trends over time

### Confusion Dashboard (`/api/dashboard/confusion`)

**Data Sources:**
- `context.confusion.repeatedSearchesDetail` → Repeated searches
- `context.confusion.deadEndsDetail` → Dead ends
- `context.confusion.dropOffsDetail` → Drop-offs
- Session analysis from events

**What Gets Displayed:**
- Repeated searches count
- Dead ends count
- Drop-offs count
- Intent mismatches

### Authority Dashboard (`/api/dashboard/authority`)

**Data Sources:**
- `metrics['ts.authority']` → Authority score
- `metrics['ai.authoritySignals']` → Trust signals
- `metrics['ai.schemaCompleteness']` → Schema completeness

**What Gets Displayed:**
- Authority score (0-100)
- Trust signals
- Confidence gaps
- Blockers

### Schema Dashboard (`/api/dashboard/schema`)

**Data Sources:**
- `metrics['ai.schemaCompleteness']` → Completeness score
- `metrics['ai.structuredDataQuality']` → Quality score

**What Gets Displayed:**
- Completeness score (0-100)
- Quality score (0-100)
- Missing schemas count
- Broken schemas count
- Available templates

### Coverage Dashboard (`/api/dashboard/coverage`)

**Data Sources:**
- `context.coverage.contentGapsDetail` → Content gaps
- `context.coverage.funnelStage` → Funnel stage
- `context.coverage.intent` → Intent
- `context.coverage.pageMetadata` → Page structure

**What Gets Displayed:**
- Content gaps count
- Missing funnel stages
- Missing intents
- Priority fixes

### Business Brief (`/api/dashboard/executive-summary`)

**Data Sources:**
- Aggregates data from all dashboard sections
- Uses telemetry events for insights

**What Gets Displayed:**
- "What's working?" insights
- "What's broken?" insights
- "What should we change?" insights
- "What should we stop?" insights
- "What should we double down on?" insights

## Configuration

### Enable Periodic Telemetry

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

### Configuration Options

- `enabled` (boolean): Enable/disable periodic telemetry
- `intervalMs` (number): Interval in milliseconds (default: 300000 = 5 minutes)

## Metrics Collection

### Real Metrics (Not Random Values)

The periodic telemetry collects **real metrics** from actual page state:

#### Schema Metrics
- **ai.schemaCompleteness**: Calculated from JSON-LD schema presence and types
- **ai.structuredDataQuality**: Validates schema structure and required fields

#### Authority Metrics
- **ts.authority**: Calculated from authority grove config and sameAs links
- **ai.authoritySignals**: Detects trust signals from page content

#### Visibility Metrics
- **ai.searchVisibility**: Measures meta tags, titles, H1s, content depth

## Memory Management

- **Bounded Arrays**: Keeps only last 50 page views and searches
- **Automatic Cleanup**: Clears old data after periodic send
- **Session Persistence**: Uses sessionStorage for cross-page persistence
- **Cleanup on Unload**: Clears intervals on page unload

## Error Handling

- **Fail-Safe**: All operations wrapped in try-catch
- **Never Breaks Site**: Errors logged to console.debug, never console.error
- **Network Resilience**: Uses sendBeacon with fetch fallback
- **No Retries**: Failed sends wait for next interval (prevents spam)

## Testing

### Verify Periodic Telemetry is Working

1. **Enable in Config**: Set `telemetry.periodic.enabled: true`
2. **Check Browser Console**: Should see periodic events being sent (debug logs)
3. **Check Dashboard**: Data should appear within 5 minutes
4. **Check Network Tab**: Should see POST requests to `/api/telemetry/events` every 5 minutes

### Verify Dashboard Integration

1. **Telemetry Dashboard**: Should show page views counting up
2. **Confusion Dashboard**: Should show dead ends, repeated searches
3. **Authority Dashboard**: Should show authority scores
4. **Schema Dashboard**: Should show completeness scores
5. **Coverage Dashboard**: Should show content gaps

## Troubleshooting

### No Data Appearing in Dashboard

1. **Check Config**: Ensure `telemetry.periodic.enabled: true`
2. **Check Telemetry URL**: Verify `telemetryUrl` is correct
3. **Check Site ID**: Ensure site exists in dashboard
4. **Check Browser Console**: Look for error messages
5. **Check Network Tab**: Verify requests are being sent

### Data Not Updating

1. **Wait 5 Minutes**: Periodic telemetry sends every 5 minutes
2. **Check Interval**: Verify `intervalMs` is not too high
3. **Check Session**: Ensure session is not expiring
4. **Check Page**: Ensure page is still loaded (not backgrounded)

### Metrics Seem Incorrect

1. **Check Page State**: Metrics are calculated from actual page state
2. **Check Config**: Ensure telemetry keys are configured
3. **Check Schemas**: Verify JSON-LD schemas are present
4. **Check Authority Config**: Verify authority grove config is set

## Best Practices

1. **Enable Periodic Telemetry**: Provides real-time dashboard updates
2. **Configure Telemetry Keys**: Include all metrics you want to track
3. **Monitor Dashboard**: Check dashboard regularly for insights
4. **Review Metrics**: Use metrics to optimize your site
5. **Adjust Interval**: Customize interval based on your needs

## Version History

- **v1.2.0**: Initial release of periodic telemetry
  - Comprehensive metrics collection
  - Real-time dashboard updates
  - Confusion detection
  - Coverage analysis
