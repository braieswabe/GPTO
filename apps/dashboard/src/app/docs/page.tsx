import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Documentation - GPTO Suite',
  description: 'GPTO Suite documentation and setup guides.',
};

export default function DocumentationPage() {
  return (
    <div className="bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-10">
          <h1 className="text-4xl font-extrabold text-gray-900">Documentation</h1>
          <p className="mt-3 text-lg text-gray-600">
            Install the Black Box via npm and configure your site with the details you need.
          </p>
        </div>

        <div className="grid gap-6">
          <div className="border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900">Black Box npm installation</h2>
            <p className="mt-2 text-gray-600">
              Install the ESM runtime and initialize it with your site configuration.
            </p>
            <div className="mt-4 space-y-3 text-sm text-gray-700">
              <div className="rounded-md bg-gray-100 p-3 font-mono text-xs text-gray-800">
                npm install @careerdriver/black-box
              </div>
              <div className="rounded-md bg-gray-100 p-3 font-mono text-xs text-gray-800 whitespace-pre-wrap">
                {`import { PantheraBlackBox } from '@careerdriver/black-box';

const blackBox = new PantheraBlackBox({
  configUrl: 'https://your-dashboard-url/api/sites/YOUR-SITE-ID/config',
  telemetryUrl: 'https://your-dashboard-url/api/telemetry/events',
  siteId: 'YOUR-SITE-ID',
});

await blackBox.init();`}
              </div>
              <p className="text-gray-600">
                The runtime is ESM-only. Use it in modern bundlers (Vite, Next.js, Webpack 5) or
                ESM-compatible environments.
              </p>
            </div>
          </div>

          <div className="border border-purple-200 rounded-lg p-6 bg-gradient-to-r from-purple-50 to-blue-50">
            <h2 className="text-xl font-semibold text-gray-900 mb-2 flex items-center">
              <span className="text-2xl mr-2">🚀</span>
              Server-Side Schema Injection (Recommended)
            </h2>
            <p className="mt-2 text-gray-600 mb-4">
              For optimal visibility with external audit tools, inject schemas server-side. Schemas automatically update when your configuration changes.
            </p>
            <div className="mt-4 space-y-3 text-sm text-gray-700">
              <div>
                <h3 className="text-base font-semibold text-gray-900 mb-2">Schema Render Endpoint</h3>
                <div className="rounded-md bg-gray-100 p-3 font-mono text-xs text-gray-800 mb-2">
                  GET /api/sites/YOUR-SITE-ID/render
                </div>
                <p className="text-gray-600 text-xs mb-3">
                  Returns HTML script tags with schemas that can be injected into your HTML template.
                </p>
                <div className="rounded-md bg-gray-900 p-3 font-mono text-xs text-green-400 whitespace-pre-wrap">
{`// Next.js / React Server Component
const schemas = await fetch(
  '/api/sites/YOUR-SITE-ID/render'
);
const schemaHTML = await schemas.text();

// Inject into HTML
<div dangerouslySetInnerHTML={{ 
  __html: schemaHTML 
}} />`}
                </div>
              </div>
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
                <p className="text-xs text-green-800">
                  ✅ <strong>Automatic Updates:</strong> Schemas are generated from your configuration and update automatically. No manual HTML edits needed!
                </p>
              </div>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900">Configuration details</h2>
            <p className="mt-2 text-gray-600">
              The Black Box pulls configuration from your dashboard and safely applies it to the page. Works alongside server-side schema injection for best results.
            </p>
            <div className="mt-4 grid gap-4 text-sm text-gray-700">
              <div>
                <h3 className="text-base font-semibold text-gray-900">Get your Site ID</h3>
                <p className="mt-1 text-gray-600">
                  In the dashboard, open <span className="font-semibold">Sites</span>, select a site,
                  and copy the UUID from the URL.
                </p>
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">Set the endpoints</h3>
                <p className="mt-1 text-gray-600">
                  Use your dashboard URL for both endpoints so the runtime can fetch config and send telemetry.
                </p>
                <ul className="mt-2 space-y-2 text-gray-700">
                  <li>
                    <span className="font-semibold">configUrl</span> →{' '}
                    <span className="font-mono">https://your-dashboard-url/api/sites/YOUR-SITE-ID/config</span>
                  </li>
                  <li>
                    <span className="font-semibold">telemetryUrl</span> →{' '}
                    <span className="font-mono">https://your-dashboard-url/api/telemetry/events</span>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">What to enable</h3>
                <ul className="mt-2 space-y-2 text-gray-700">
                  <li>Telemetry: turn on event collection in the site config.</li>
                  <li>Brand/schema: set your brand name and JSON-LD schema fields.</li>
                  <li>Features: enable ads, autofill, and geo nodes only after review.</li>
                </ul>
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">Verify</h3>
                <p className="mt-1 text-gray-600">
                  Open the browser console for <span className="font-mono">[Panthera Black Box]</span> logs and
                  confirm your config endpoint returns JSON.
                </p>
                <p className="mt-2 text-gray-600">
                  <strong>For server-side schemas:</strong> View page source and search for <span className="font-mono">application/ld+json</span> to verify schemas are in the HTML.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
