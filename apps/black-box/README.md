# Panthera Black Box Runtime

Minimal JavaScript runtime (<10KB gzipped) that reads JSON configuration and sends telemetry from client websites.

## Safety

- **No eval()** - No code execution
- **No Function()** - No dynamic function creation
- **Declarative only** - All operations are safe JSON/DOM manipulations
- **Fail-safe** - Never breaks the host site

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
