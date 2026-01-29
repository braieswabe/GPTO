# GPTO Black Box Installation Guide

Complete installation guide for the Panthera Black Box runtime (v1.2.0+).

## Quick Start

### Option 1: CDN (Fastest)

Add this script tag to your HTML `<head>`:

```html
<script
  src="https://unpkg.com/@careerdriver/black-box@latest/dist/runtime.global.js"
  data-config-url="https://gpto-dashboard.vercel.app/api/sites/YOUR-SITE-ID/config"
  data-telemetry-url="https://gpto-dashboard.vercel.app/api/telemetry/events"
  data-site-id="YOUR-SITE-ID"
  async
></script>
```

Replace `YOUR-SITE-ID` with your actual Site ID from the GPTO dashboard.

### Option 2: NPM Package

```bash
npm install @careerdriver/black-box@latest
# or
pnpm add @careerdriver/black-box@latest
```

Then import and initialize:

```typescript
import { PantheraBlackBox } from '@careerdriver/black-box';

const blackBox = new PantheraBlackBox({
  configUrl: 'https://gpto-dashboard.vercel.app/api/sites/YOUR-SITE-ID/config',
  telemetryUrl: 'https://gpto-dashboard.vercel.app/api/telemetry/events',
  siteId: 'YOUR-SITE-ID',
});

await blackBox.init();
```

## Configuration

### Basic Configuration

Create a site configuration in the GPTO dashboard with at minimum:

```json
{
  "panthera_blackbox": {
    "version": "1.2.0",
    "site": {
      "domain": "example.com",
      "brand": "Your Brand Name",
      "verticals": ["general"],
      "geo": ["US"]
    },
    "telemetry": {
      "emit": true,
      "keys": [
        "ts.authority",
        "ai.schemaCompleteness",
        "ai.structuredDataQuality",
        "ai.authoritySignals",
        "ai.searchVisibility"
      ]
    }
  }
}
```

### Enable Periodic Telemetry (Recommended)

Add periodic telemetry configuration for real-time dashboard updates:

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

**Configuration Options:**
- `enabled` (boolean): Enable/disable periodic telemetry (default: false)
- `intervalMs` (number): Interval in milliseconds (default: 300000 = 5 minutes)

**What Periodic Telemetry Does:**
- Sends comprehensive metrics every 5 minutes
- Populates telemetry, confusion, authority, schema, and coverage dashboards
- Tracks page views, interactions, searches
- Detects confusion patterns (dead ends, repeated searches)
- Analyzes content gaps and funnel stages
- Calculates real metrics from page state

## Installation Methods

### Method 1: Script Tag (CDN) - Recommended for Quick Setup

**Pros:**
- Fastest setup
- No build step required
- Automatic updates when you change version
- Works with any HTML page

**Cons:**
- Loads from CDN (external dependency)
- Less control over version

**Steps:**

1. Get your Site ID from the GPTO dashboard
2. Add the script tag to your HTML `<head>`:

```html
<script
  src="https://unpkg.com/@careerdriver/black-box@latest/dist/runtime.global.js"
  data-config-url="https://gpto-dashboard.vercel.app/api/sites/YOUR-SITE-ID/config"
  data-telemetry-url="https://gpto-dashboard.vercel.app/api/telemetry/events"
  data-site-id="YOUR-SITE-ID"
  async
></script>
```

3. Replace `YOUR-SITE-ID` with your actual Site ID
4. Configure your site in the GPTO dashboard
5. Enable periodic telemetry (optional but recommended)

### Method 2: NPM Package - Recommended for Modern Apps

**Pros:**
- Version control
- Works with bundlers (Vite, Webpack, Next.js)
- TypeScript support
- Tree-shaking support

**Cons:**
- Requires build step
- ESM-only (modern bundlers)

**Steps:**

1. Install the package:

```bash
npm install @careerdriver/black-box@latest
# or
pnpm add @careerdriver/black-box@latest
# or
yarn add @careerdriver/black-box@latest
```

2. Import and initialize:

```typescript
import { PantheraBlackBox } from '@careerdriver/black-box';

const blackBox = new PantheraBlackBox({
  configUrl: 'https://gpto-dashboard.vercel.app/api/sites/YOUR-SITE-ID/config',
  telemetryUrl: 'https://gpto-dashboard.vercel.app/api/telemetry/events',
  siteId: 'YOUR-SITE-ID',
});

await blackBox.init();
```

3. Configure your site in the GPTO dashboard
4. Enable periodic telemetry (optional but recommended)

### Method 3: Local File

**Pros:**
- Full control
- No external dependencies
- Works offline

**Cons:**
- Manual updates required
- Must host the file yourself

**Steps:**

1. Download the file:

```bash
curl -o black-box.js https://unpkg.com/@careerdriver/black-box@latest/dist/runtime.global.js
```

2. Host it on your server (e.g., `/static/black-box.js`)
3. Add script tag:

```html
<script
  src="/static/black-box.js"
  data-config-url="https://gpto-dashboard.vercel.app/api/sites/YOUR-SITE-ID/config"
  data-telemetry-url="https://gpto-dashboard.vercel.app/api/telemetry/events"
  data-site-id="YOUR-SITE-ID"
  async
></script>
```

## Verification

### Check if Black Box is Loaded

Open browser console and check:

```javascript
// Should return the PantheraBlackBox class
console.log(window.PantheraBlackBox);

// Should return the initialized instance
console.log(window.panthera);
```

### Verify Schemas are Injected

1. Open your page in a browser
2. View page source (Right-click → View Page Source)
3. Search for `application/ld+json`
4. You should see JSON-LD schema scripts in the `<head>`

### Verify Telemetry is Working

1. Open browser DevTools → Network tab
2. Filter by "telemetry" or "events"
3. You should see POST requests to `/api/telemetry/events`
4. For periodic telemetry, check every 5 minutes

### Verify Dashboard Data

1. Go to GPTO dashboard
2. Navigate to your site
3. Check the dashboard sections:
   - Telemetry: Should show page views
   - Confusion: Should show dead ends, repeated searches
   - Authority: Should show authority scores
   - Schema: Should show completeness scores
   - Coverage: Should show content gaps

## Troubleshooting

### No Schemas Appearing

1. **Check Configuration**: Ensure config is valid and accessible
2. **Check Console**: Look for error messages
3. **Check Network**: Verify config URL is accessible
4. **Check Site ID**: Ensure Site ID matches dashboard

### No Telemetry Data

1. **Check Telemetry Enabled**: Ensure `telemetry.emit: true` in config
2. **Check Telemetry URL**: Verify URL is correct
3. **Check Site ID**: Ensure site exists in dashboard
4. **Check CORS**: Verify CORS headers are set correctly
5. **Check Console**: Look for error messages

### Periodic Telemetry Not Working

1. **Check Config**: Ensure `telemetry.periodic.enabled: true`
2. **Check Interval**: Verify `intervalMs` is not too high
3. **Check Browser**: Ensure page is not backgrounded
4. **Wait 5 Minutes**: Periodic telemetry sends every 5 minutes
5. **Check Network Tab**: Look for periodic POST requests

### Dashboard Shows "No Data Yet"

1. **Wait for Data**: First data appears within 5 minutes
2. **Check Telemetry**: Verify telemetry is enabled and working
3. **Check Time Range**: Ensure time range includes recent data
4. **Check Site ID**: Verify correct site is selected

## Best Practices

1. **Enable Periodic Telemetry**: Provides real-time dashboard updates
2. **Use Latest Version**: Always use `@latest` or latest stable version
3. **Configure Telemetry Keys**: Include all metrics you want to track
4. **Monitor Dashboard**: Check dashboard regularly for insights
5. **Test Configuration**: Validate config before deploying
6. **Use HTTPS**: Always use HTTPS for config and telemetry URLs
7. **Set Appropriate Interval**: 5 minutes is recommended, adjust based on needs

## Version Information

- **Current Version**: v1.2.0
- **Latest Features**: Periodic telemetry, real-time dashboard updates
- **Breaking Changes**: None (backward compatible)
- **Migration**: No migration needed, just enable periodic telemetry in config

## Additional Resources

- [Black Box README](./apps/black-box/README.md) - Complete runtime documentation
- [Periodic Telemetry Guide](./apps/black-box/PERIODIC_TELEMETRY.md) - Detailed periodic telemetry guide
- [Configuration Samples](./samples/README.md) - Example configurations
- [CHANGELOG](./CHANGELOG.md) - Version history and changes

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the documentation
3. Check browser console for errors
4. Verify configuration is correct
5. Contact support if issues persist
