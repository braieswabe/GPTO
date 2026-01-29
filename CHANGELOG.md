# Changelog

All notable changes to GPTO Suite will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2026-01-29

### Added

#### 🚀 Periodic Telemetry Data Collection
- **Automatic Metrics Collection**: Sends comprehensive metrics to GPTO dashboard every 5 minutes
  - Real-time dashboard updates for telemetry, confusion, authority, schema, and coverage
  - Configurable interval (default: 5 minutes / 300,000ms)
  - Opt-in via configuration: `telemetry.periodic.enabled: true`

- **Enhanced Metrics Collection**
  - Real metrics calculated from actual page state (not random values)
  - Schema completeness: Detects JSON-LD schemas and calculates completeness score
  - Structured data quality: Validates schema structure and required fields
  - Authority signals: Calculates trust signals from page content and config
  - Search visibility: Measures meta tags, titles, H1s, content depth

- **Confusion Detection**
  - Repeated searches: Tracks queries searched multiple times in session
  - Dead ends: Detects pages with no navigation after threshold (60s)
  - Drop-offs: Identifies sessions with minimal activity (≤2 events)
  - Client-side tracking with bounded memory (last 50 events)

- **Coverage Analysis**
  - Content gaps: Detects missing what/who/how/trust sections
  - Funnel stage detection: Identifies awareness/consideration/decision/retention stages
  - Intent detection: Categorizes pages (pricing/demo/docs/general)
  - Page metadata: Tracks H1/H2 counts, text length, JSON-LD presence

- **Dashboard Integration**
  - All periodic data automatically populates dashboard sections
  - Telemetry dashboard: Page views, visits, top pages, search intents
  - Confusion dashboard: Dead ends, repeated searches, drop-offs, intent mismatches
  - Authority dashboard: Authority scores, trust signals, confidence gaps
  - Schema dashboard: Completeness scores, quality scores, missing/broken schemas
  - Coverage dashboard: Content gaps, missing funnel stages, priority fixes
  - Business Brief: Executive insights from aggregated data
  - Pulse Cards: Revenue impact, experience health, trust lift, coverage risk

#### 📊 State Management
- Internal state tracking for metrics aggregation
- Session persistence across periodic sends
- Memory-safe bounded arrays (prevents memory leaks)
- Automatic cleanup on page unload

### Changed

- **Black Box Runtime** (`apps/black-box/`)
  - Version bumped to `1.2.0`
  - Enhanced `collectMetrics()` to gather real metrics from page state
  - Added `sendPeriodicTelemetry()` method for comprehensive data collection
  - Modified `startTelemetry()` to support periodic telemetry timer
  - Added cleanup handlers for interval management

### Technical Details

- **Event Structure**: Periodic events use `event_type: 'custom'` with `periodic: true` context flag
- **Heartbeat Events**: Also sends `page_view` events to ensure telemetry dashboard counts correctly
- **Fail-Safe Design**: All periodic operations wrapped in try-catch, never breaks the site
- **Network Resilience**: Uses `navigator.sendBeacon()` with `fetch()` fallback
- **Backward Compatible**: Existing event-driven telemetry continues unchanged

## [1.1.0] - 2026-01-28

### Added

#### 🚀 Automatic Server-Side Schema Injection
- **Server-Side Schema Generator** (`packages/servos/gpto/src/server-schema-generator.ts`)
  - Automatic schema generation from configuration
  - Server-side rendering support for external audit tools
  - No manual HTML edits required
  - Automatic updates when configuration changes

- **New API Endpoints**
  - `GET /api/sites/[id]/render` - Returns HTML script tags with schemas
  - `GET /api/sites/[id]/proxy?url=<target-url>` - Proxies website with schemas injected

- **Server-Side Utilities**
  - `generateSchemaScriptTags()` - Generate HTML script tags from config
  - `injectSchemasIntoHTML()` - Inject schemas into existing HTML
  - `generateOrganizationSchema()` - Generate Organization schema
  - `generateLocalBusinessSchema()` - Generate LocalBusiness schema
  - `generateAllSchemas()` - Generate all schemas for a config

#### 📚 Documentation Updates
- Updated installation guides with server-side injection options
- Added integration examples for Next.js, React, PHP, Express.js
- Created sample configuration files for different industries
- Added troubleshooting guides for external audit tools

#### 🎯 Configuration Improvements
- Fixed autofill forms schema validation (now requires `selector` and `map`)
- Added configuration sample files for e-commerce, healthcare, restaurant, education
- Improved configuration validation and error messages

### Changed

- **Black Box Runtime** (`apps/black-box/`)
  - Version bumped to `1.1.0`
  - Enhanced schema injection with better error handling
  - Improved telemetry collection

- **GPTO Servo** (`packages/servos/gpto/`)
  - Version bumped to `1.1.0`
  - Added server-side schema generation capabilities
  - Exported new utilities for schema generation

- **Installation Process**
  - Now supports both client-side and server-side schema injection
  - Recommended approach: Server-side + Client-side for best results
  - Automatic schema updates when configuration changes

### Fixed

- Fixed autofill configuration schema validation errors
- Fixed missing `selector` property requirement in autofill forms
- Improved error messages for invalid configurations
- Fixed schema visibility issues with external audit tools

### Documentation

- Updated `apps/black-box/README.md` with server-side injection guide
- Updated `apps/dashboard/src/app/install/page.tsx` with new installation steps
- Updated `apps/dashboard/src/app/sites/[id]/page.tsx` with server-side options
- Updated `apps/dashboard/src/app/docs/page.tsx` with new features
- Created `AUTOMATIC_SCHEMA_INJECTION.md` - Complete guide
- Created `INSTALLATION_UPDATED.md` - Migration guide
- Created `EXTERNAL_AUDIT_SOLUTION.md` - Solution for external audit tools
- Created `AUDIT_TROUBLESHOOTING.md` - Troubleshooting guide
- Created `CONFIG_FIX_SUMMARY.md` - Configuration fix documentation
- Created sample configuration files in `samples/` directory

## [1.0.3] - Previous Release

### Features
- Client-side JSON-LD schema injection
- Authority Grove integration
- TruthSeeker content re-ranking
- Telemetry tracking
- Basic configuration management

## [1.0.0] - Initial Release

### Features
- Black Box runtime
- Dashboard interface
- Basic AI search optimization
- Configuration management

---

## Upgrade Guide

### From 1.0.x to 1.1.0

1. **Update Black Box Package**
   ```bash
   npm install @careerdriver/black-box@latest
   # or
   pnpm add @careerdriver/black-box@latest
   ```

2. **Add Server-Side Schema Injection** (Recommended)
   - Use `/api/sites/[id]/render` endpoint to fetch schemas
   - Inject into your HTML template
   - See `AUTOMATIC_SCHEMA_INJECTION.md` for details

3. **Update Configuration**
   - Ensure autofill forms have `selector` and `map` properties
   - See `CONFIG_FIX_SUMMARY.md` for migration details

4. **Verify Installation**
   - Check browser console for Black Box initialization
   - Verify schemas in page source
   - Test with external audit tool

## Breaking Changes

### Configuration Schema
- `autofill.forms[]` now requires `selector` property (was optional)
- `autofill.forms[]` structure changed from field definitions to form objects

### Migration
- Update autofill configuration to use new structure
- See `CONFIG_FIX_SUMMARY.md` for examples

## Deprecations

None in this release.

## Security

- No security vulnerabilities addressed in this release
- All changes maintain existing security posture
