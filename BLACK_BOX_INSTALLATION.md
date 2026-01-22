# How to Install Black Box and Telemetry on Your Website

## Step 1: Build the Black Box Script

First, build the Black Box runtime script:

```bash
pnpm --filter @gpto/black-box build
```

This creates `apps/black-box/dist/runtime.global.js` (the compiled script).

## Step 2: Get Your Site ID

1. Log into your dashboard
2. Go to **Sites** page
3. Click on your site
4. Copy the **Site ID** from the URL (e.g., `4521291c-8a22-42ce-b379-61e5bd415e58`)

## Step 3: Get Your Dashboard URL

Your dashboard URL is where your Next.js app is deployed:
- **Development**: `http://localhost:3000`
- **Production**: `https://your-app.vercel.app` (or your custom domain)

## Step 4: Add the Script Tag to Your Website

Add this script tag to your website's HTML (in the `<head>` or before `</body>`):

```html
<script
  src="https://your-dashboard-url/black-box.js"
  data-config-url="https://your-dashboard-url/api/sites/YOUR-SITE-ID/config"
  data-telemetry-url="https://your-dashboard-url/api/telemetry/events"
  data-site-id="YOUR-SITE-ID"
  async
></script>
```

### Example (Development):

```html
<script
  src="http://localhost:3000/black-box.js"
  data-config-url="http://localhost:3000/api/sites/4521291c-8a22-42ce-b379-61e5bd415e58/config"
  data-telemetry-url="http://localhost:3000/api/telemetry/events"
  data-site-id="4521291c-8a22-42ce-b379-61e5bd415e58"
  async
></script>
```

### Example (Production):

```html
<script
  src="https://your-app.vercel.app/black-box.js"
  data-config-url="https://your-app.vercel.app/api/sites/4521291c-8a22-42ce-b379-61e5bd415e58/config"
  data-telemetry-url="https://your-app.vercel.app/api/telemetry/events"
  data-site-id="4521291c-8a22-42ce-b379-61e5bd415e58"
  async
></script>
```

## Step 5: Verify Installation

1. **Open your website** in a browser
2. **Open Developer Tools** (F12)
3. **Check the Console** for `[Panthera Black Box]` messages
4. **Check the Network tab** for requests to:
   - `/api/sites/[site-id]/config` (should return your config JSON)
   - `/api/telemetry/events` (if telemetry is enabled)

## Step 6: Configure Your Site

1. Go to your dashboard → **Sites** → Select your site
2. Click **"Propose Update"**
3. Use **Panthera AI Assistant** or manually edit the JSON to:
   - Enable telemetry: `"Enable telemetry"`
   - Set brand name: `"Set brand to Your Company Name"`
   - Configure other settings
4. Click **"Propose Update"**
5. **Approve** the update
6. **Refresh your website** (hard refresh: Cmd+Shift+R / Ctrl+Shift+R)

## What Happens After Installation

### Immediate (within 60 seconds):
- ✅ Black Box loads and fetches configuration
- ✅ JSON-LD schema injected into page `<head>`
- ✅ Telemetry starts sending events (if enabled)

### After Page Refresh:
- ✅ Autofill activates (if configured)
- ✅ Ad slots appear (if configured)
- ✅ Geo nodes activate (if configured)

## Troubleshooting

### Script Not Loading
- **Check**: Is the script URL correct? Try opening `/black-box.js` directly in browser
- **Fix**: Make sure you've built the script: `pnpm --filter @gpto/black-box build`

### Config Not Updating
- **Check**: Open `/api/sites/[site-id]/config` in browser - does it show updated config?
- **Fix**: Make sure you've approved the update in the dashboard

### No Changes Visible
- **Check**: Open browser console - are there any errors?
- **Check**: Is telemetry enabled in your config? (`telemetry.emit: true`)
- **Check**: View page source - is the JSON-LD schema present?

### CORS Errors
- **Fix**: The script endpoint already has CORS headers, but make sure your dashboard URL matches

## Manual Initialization (Alternative)

If you prefer to initialize manually instead of using the script tag:

```javascript
// Load the script first
const script = document.createElement('script');
script.src = 'https://your-dashboard-url/black-box.js';
script.onload = () => {
  // Initialize manually
  const blackBox = new PantheraBlackBox({
    configUrl: 'https://your-dashboard-url/api/sites/YOUR-SITE-ID/config',
    telemetryUrl: 'https://your-dashboard-url/api/telemetry/events',
    siteId: 'YOUR-SITE-ID',
  });
  
  blackBox.init();
};
document.head.appendChild(script);
```

## Next Steps

1. ✅ Install the script tag on your website
2. ✅ Configure your site settings via the dashboard
3. ✅ Approve updates to activate changes
4. ✅ Monitor telemetry in the dashboard
5. ✅ Use Panthera AI to make configuration changes easily
