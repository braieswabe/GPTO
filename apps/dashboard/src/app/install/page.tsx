'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function InstallPage() {
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<'npm' | 'script' | 'cdn'>('script');

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-extrabold text-gray-900">How to Install GPTO</h1>
          <p className="mt-3 text-lg text-gray-600">
            Get started with GPTO in minutes. Follow these steps to optimize your website for AI search engines.
          </p>
        </div>

        {/* Quick Start Steps */}
        <div className="mb-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Quick Start</h2>
          <ol className="space-y-4">
            <li className="flex items-start">
              <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold mr-4">
                1
              </span>
              <div>
                <h3 className="font-semibold text-gray-900">Create an Account</h3>
                <p className="text-gray-600 mt-1">
                  {isAuthenticated ? (
                    <>You're logged in! Go to <Link href="/sites" className="text-blue-600 hover:underline">Sites</Link> to add your first site.</>
                  ) : (
                    <>Sign up or <Link href="/login" className="text-blue-600 hover:underline">log in</Link> to get started.</>
                  )}
                </p>
              </div>
            </li>
            <li className="flex items-start">
              <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold mr-4">
                2
              </span>
              <div>
                <h3 className="font-semibold text-gray-900">Add Your Site</h3>
                <p className="text-gray-600 mt-1">
                  {isAuthenticated ? (
                    <>Go to <Link href="/sites/new" className="text-blue-600 hover:underline">Add New Site</Link> and enter your domain.</>
                  ) : (
                    <>Add your website domain in the dashboard to get your Site ID.</>
                  )}
                </p>
              </div>
            </li>
            <li className="flex items-start">
              <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold mr-4">
                3
              </span>
              <div>
                <h3 className="font-semibold text-gray-900">Install Black Box</h3>
                <p className="text-gray-600 mt-1">Choose an installation method below and add the code to your website.</p>
              </div>
            </li>
            <li className="flex items-start">
              <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold mr-4">
                4
              </span>
              <div>
                <h3 className="font-semibold text-gray-900">Configure Authority Grove</h3>
                <p className="text-gray-600 mt-1">Set up keywords, verticals, and partner relationships in your site configuration.</p>
              </div>
            </li>
            <li className="flex items-start">
              <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold mr-4">
                5
              </span>
              <div>
                <h3 className="font-semibold text-gray-900">Run Your First Audit</h3>
                <p className="text-gray-600 mt-1">Check your AI Search Optimization score and follow recommendations to improve.</p>
              </div>
            </li>
          </ol>
        </div>

        {/* Installation Methods */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Installation Methods</h2>
          
          {/* Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('script')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'script'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Script Tag (Recommended)
              </button>
              <button
                onClick={() => setActiveTab('npm')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'npm'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                NPM Package
              </button>
              <button
                onClick={() => setActiveTab('cdn')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'cdn'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                CDN (unpkg)
              </button>
            </nav>
          </div>

          {/* Script Tag Method */}
          {activeTab === 'script' && (
            <div className="space-y-6">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Step 1: Get Your Site ID</h3>
                <p className="text-gray-600 mb-4">
                  {isAuthenticated ? (
                    <>Go to <Link href="/sites" className="text-blue-600 hover:underline">Sites</Link>, select your site, and copy the Site ID from the URL or site details page.</>
                  ) : (
                    <>After adding your site in the dashboard, you'll receive a Site ID. Copy this ID for the next step.</>
                  )}
                </p>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Step 2: Add Script Tag</h3>
                <p className="text-gray-600 mb-4">
                  Add this script tag to your website's HTML, preferably in the <code className="bg-gray-200 px-1 rounded">&lt;head&gt;</code> section:
                </p>
                <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-green-400 text-sm">
{`<script
  src="https://gpto-dashboard.vercel.app/black-box.js"
  data-config-url="https://gpto-dashboard.vercel.app/api/sites/YOUR-SITE-ID/config"
  data-telemetry-url="https://gpto-dashboard.vercel.app/api/telemetry/events"
  data-site-id="YOUR-SITE-ID"
  async
></script>`}
                  </pre>
                </div>
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-sm text-yellow-800">
                    <strong>Important:</strong> Replace <code className="bg-yellow-100 px-1 rounded">YOUR-SITE-ID</code> with your actual Site ID from the dashboard.
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Step 3: (Optional) Server-Side Schema Injection</h3>
                <p className="text-gray-600 mb-4">
                  For optimal visibility with external audit tools, inject schemas server-side. This makes schemas visible in the initial HTML response:
                </p>
                <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto mb-4">
                  <pre className="text-green-400 text-sm">
{`// Fetch schemas automatically
const schemas = await fetch(
  'https://gpto-dashboard.vercel.app/api/sites/YOUR-SITE-ID/render'
);
const schemaHTML = await schemas.text();

// Inject into your HTML template
<head>
  {schemaHTML}
</head>`}
                  </pre>
                </div>
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded">
                  <p className="text-sm text-blue-800">
                    <strong>💡 Tip:</strong> Schemas automatically update when your configuration changes. No manual HTML edits needed!
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Step 4: Verify Installation</h3>
                <p className="text-gray-600 mb-4">
                  Open your website in a browser and check the browser console. You should see:
                </p>
                <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-green-400 text-sm">
{`[Panthera Black Box] Initialization started
[Panthera Black Box] Config loaded successfully
[Panthera Black Box] Schemas injected`}
                  </pre>
                </div>
                <p className="text-gray-600 mt-4">
                  You can also check the page source to verify JSON-LD schemas are present in the <code className="bg-gray-200 px-1 rounded">&lt;head&gt;</code> section.
                </p>
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded">
                  <p className="text-sm text-green-800">
                    <strong>✅ Automatic Updates:</strong> Schemas are automatically generated from your configuration and update when you change settings. No manual HTML edits required!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* NPM Method */}
          {activeTab === 'npm' && (
            <div className="space-y-6">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Step 1: Install Package</h3>
                <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto mb-4">
                  <pre className="text-green-400 text-sm">
{`npm install @careerdriver/black-box`}
                  </pre>
                </div>
                <p className="text-gray-600">
                  The runtime is ESM-only. Works with modern bundlers (Vite, Next.js, Webpack 5) or ESM-compatible environments.
                </p>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Step 2: Import and Initialize</h3>
                <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-green-400 text-sm">
{`import { PantheraBlackBox } from '@careerdriver/black-box';

const blackBox = new PantheraBlackBox({
  configUrl: 'https://gpto-dashboard.vercel.app/api/sites/YOUR-SITE-ID/config',
  telemetryUrl: 'https://gpto-dashboard.vercel.app/api/telemetry/events',
  siteId: 'YOUR-SITE-ID',
});

await blackBox.init();`}
                  </pre>
                </div>
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> Replace <code className="bg-yellow-100 px-1 rounded">YOUR-SITE-ID</code> with your actual Site ID from the dashboard.
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Step 3: Enable Periodic Telemetry (Optional but Recommended)</h3>
                <p className="text-gray-600 mb-4">
                  Enable periodic telemetry in your site configuration to get real-time dashboard updates:
                </p>
                <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto mb-4">
                  <pre className="text-green-400 text-sm">
{`{
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
}`}
                  </pre>
                </div>
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded">
                  <p className="text-sm text-blue-800">
                    <strong>💡 What Periodic Telemetry Does:</strong> Automatically sends comprehensive metrics to your dashboard every 5 minutes, populating telemetry, confusion, authority, schema, and coverage sections with real-time data.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* CDN Method */}
          {activeTab === 'cdn' && (
            <div className="space-y-6">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Step 1: Add Script Tag</h3>
                <p className="text-gray-600 mb-4">
                  Add this script tag using the unpkg CDN:
                </p>
                <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-green-400 text-sm">
{`<script
  src="https://unpkg.com/@careerdriver/black-box@latest/dist/runtime.global.js"
  data-config-url="https://gpto-dashboard.vercel.app/api/sites/YOUR-SITE-ID/config"
  data-telemetry-url="https://gpto-dashboard.vercel.app/api/telemetry/events"
  data-site-id="YOUR-SITE-ID"
  async
></script>`}
                  </pre>
                </div>
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-sm text-yellow-800">
                    <strong>Important:</strong> Replace <code className="bg-yellow-100 px-1 rounded">YOUR-SITE-ID</code> with your actual Site ID from the dashboard.
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Step 2: Enable Periodic Telemetry (Optional but Recommended)</h3>
                <p className="text-gray-600 mb-4">
                  Enable periodic telemetry in your site configuration to get real-time dashboard updates:
                </p>
                <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto mb-4">
                  <pre className="text-green-400 text-sm">
{`{
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
}`}
                  </pre>
                </div>
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded">
                  <p className="text-sm text-blue-800">
                    <strong>💡 What Periodic Telemetry Does:</strong> Automatically sends comprehensive metrics to your dashboard every 5 minutes, populating telemetry, confusion, authority, schema, and coverage sections with real-time data.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Periodic Telemetry */}
        <div className="mb-12 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">📊 Periodic Telemetry (v1.2.0+)</h2>
          <p className="text-gray-700 mb-6">
            Enable periodic telemetry to automatically send comprehensive metrics to your dashboard every 5 minutes. This ensures your dashboard is always up-to-date with real-time data for telemetry, confusion, authority, schema, and coverage metrics.
          </p>
          
          <div className="bg-white rounded-lg p-6 border border-green-200 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Configuration</h3>
            <p className="text-gray-600 mb-4">
              Add this to your site configuration in the GPTO dashboard:
            </p>
            <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto mb-4">
              <pre className="text-green-400 text-sm">
{`{
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
}`}
              </pre>
            </div>
            <div className="grid gap-4 md:grid-cols-2 mt-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">What Gets Sent</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>✅ Page views, interactions, searches</li>
                  <li>✅ Schema completeness & quality</li>
                  <li>✅ Authority & trust signals</li>
                  <li>✅ Confusion patterns (dead ends, repeated searches)</li>
                  <li>✅ Content gaps & funnel stages</li>
                  <li>✅ Intent detection</li>
                </ul>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Dashboard Sections</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>📈 Telemetry Dashboard</li>
                  <li>🔍 Confusion Dashboard</li>
                  <li>⭐ Authority Dashboard</li>
                  <li>📋 Schema Dashboard</li>
                  <li>📊 Coverage Dashboard</li>
                  <li>💼 Business Brief</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>💡 Tip:</strong> Periodic telemetry is opt-in. Once enabled, data will start appearing in your dashboard within 5 minutes. The interval is configurable (default: 5 minutes / 300,000ms).
            </p>
          </div>
        </div>

        {/* Server-Side Schema Injection */}
        <div className="mb-12 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">🚀 Automatic Server-Side Schema Injection</h2>
          <p className="text-gray-700 mb-6">
            GPTO automatically generates and injects schemas server-side, making them visible to external audit tools without requiring manual HTML edits. Schemas update automatically when your configuration changes.
          </p>
          
          <div className="grid gap-6 md:grid-cols-2 mb-6">
            <div className="bg-white rounded-lg p-6 border border-blue-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <span className="text-2xl mr-2">📡</span>
                Schema Render Endpoint
              </h3>
              <p className="text-gray-600 text-sm mb-3">
                Fetch schemas and inject into your HTML template:
              </p>
              <div className="bg-gray-900 rounded p-3 overflow-x-auto">
                <pre className="text-green-400 text-xs">
{`const schemas = await fetch(
  '/api/sites/[id]/render'
);
const schemaHTML = await schemas.text();`}
                </pre>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 border border-blue-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <span className="text-2xl mr-2">🔄</span>
                Automatic Updates
              </h3>
              <ul className="space-y-2 text-gray-600 text-sm">
                <li>✅ Schemas update when config changes</li>
                <li>✅ No manual HTML edits needed</li>
                <li>✅ Telemetry-driven improvements</li>
                <li>✅ Visible to external audit tools</li>
              </ul>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 border border-blue-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Integration Examples</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Next.js / React:</p>
                <div className="bg-gray-900 rounded p-3 overflow-x-auto">
                  <pre className="text-green-400 text-xs">
{`const schemaScripts = await fetch(
  '/api/sites/[id]/render'
).then(r => r.text());

<div dangerouslySetInnerHTML={{ 
  __html: schemaScripts 
}} />`}
                  </pre>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">PHP / Server-Side:</p>
                <div className="bg-gray-900 rounded p-3 overflow-x-auto">
                  <pre className="text-green-400 text-xs">
{`<?php
$schemas = file_get_contents(
  'https://gpto-dashboard.vercel.app/api/sites/[id]/render'
);
echo $schemas;
?>`}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Configuration Guide */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Configuration Guide</h2>
          
          <div className="grid gap-6 md:grid-cols-2">
            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                <span className="inline-block w-8 h-8 bg-blue-100 text-blue-600 rounded-full text-center leading-8 mr-2">1</span>
                Basic Setup
              </h3>
              <ul className="space-y-2 text-gray-600 text-sm">
                <li>• Add your site domain in the dashboard</li>
                <li>• Copy your Site ID</li>
                <li>• Install Black Box using your preferred method</li>
                <li>• (Optional) Add server-side schema injection</li>
                <li>• Verify schemas are being injected</li>
              </ul>
            </div>

            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                <span className="inline-block w-8 h-8 bg-blue-100 text-blue-600 rounded-full text-center leading-8 mr-2">2</span>
                Authority Grove
              </h3>
              <ul className="space-y-2 text-gray-600 text-sm">
                <li>• Configure keywords (5-10 industry keywords)</li>
                <li>• Set verticals (2-5 industry verticals)</li>
                <li>• Add sameAs links (social profiles)</li>
                <li>• Build partner relationships</li>
              </ul>
            </div>

            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                <span className="inline-block w-8 h-8 bg-blue-100 text-blue-600 rounded-full text-center leading-8 mr-2">3</span>
                Run Audits
              </h3>
              <ul className="space-y-2 text-gray-600 text-sm">
                <li>• Navigate to your site in the dashboard</li>
                <li>• Click "Run Audit" to analyze your site</li>
                <li>• Review AI Search Optimization score</li>
                <li>• Address recommendations</li>
              </ul>
            </div>

            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                <span className="inline-block w-8 h-8 bg-blue-100 text-blue-600 rounded-full text-center leading-8 mr-2">4</span>
                Monitor Progress
              </h3>
              <ul className="space-y-2 text-gray-600 text-sm">
                <li>• Check AI Search Visibility score</li>
                <li>• Track schema completeness metrics</li>
                <li>• Monitor authority signal strength</li>
                <li>• Review telemetry data</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Using the Dashboard */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Using the Dashboard</h2>
          
          <div className="space-y-6">
            <div className="border-l-4 border-blue-500 bg-blue-50 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Sites Management</h3>
              <p className="text-gray-700 mb-3">
                {isAuthenticated ? (
                  <>Go to <Link href="/sites" className="text-blue-600 hover:underline font-semibold">Sites</Link> to manage all your websites.</>
                ) : (
                  <>After logging in, you can add and manage multiple sites from the Sites page.</>
                )}
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm">
                <li>Add new sites with their domain names</li>
                <li>View site details and configuration</li>
                <li>Edit Authority Grove settings</li>
                <li>Run technical audits</li>
                <li>View audit results and recommendations</li>
              </ul>
            </div>

            <div className="border-l-4 border-green-500 bg-green-50 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Running Audits</h3>
              <p className="text-gray-700 mb-3">
                Audits analyze your website's AI search optimization across 5 key dimensions:
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm">
                <li><strong>Schema Quality</strong> (30 points): JSON-LD schema completeness and validity</li>
                <li><strong>Authority Signals</strong> (25 points): Authority Grove configuration and sameAs links</li>
                <li><strong>Structured Data Completeness</strong> (20 points): Required schemas for your tier</li>
                <li><strong>Factual Accuracy</strong> (15 points): Content structure and clarity</li>
                <li><strong>Traditional Elements</strong> (10 points): Title tags and meta descriptions</li>
              </ul>
            </div>

            <div className="border-l-4 border-purple-500 bg-purple-50 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Understanding Scores</h3>
              <div className="grid gap-4 md:grid-cols-2 mt-4">
                <div>
                  <div className="flex items-center mb-2">
                    <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                    <span className="font-semibold text-gray-900">80-100: Excellent</span>
                  </div>
                  <p className="text-sm text-gray-700 ml-5">Your site is well-optimized for AI search engines.</p>
                </div>
                <div>
                  <div className="flex items-center mb-2">
                    <span className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></span>
                    <span className="font-semibold text-gray-900">60-79: Good</span>
                  </div>
                  <p className="text-sm text-gray-700 ml-5">Minor improvements needed for better visibility.</p>
                </div>
                <div>
                  <div className="flex items-center mb-2">
                    <span className="w-3 h-3 bg-orange-500 rounded-full mr-2"></span>
                    <span className="font-semibold text-gray-900">40-59: Moderate</span>
                  </div>
                  <p className="text-sm text-gray-700 ml-5">Significant improvements needed.</p>
                </div>
                <div>
                  <div className="flex items-center mb-2">
                    <span className="w-3 h-3 bg-red-500 rounded-full mr-2"></span>
                    <span className="font-semibold text-gray-900">0-39: Poor</span>
                  </div>
                  <p className="text-sm text-gray-700 ml-5">Critical issues need immediate attention.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Best Practices */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Best Practices</h2>
          
          <div className="grid gap-6 md:grid-cols-2">
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">✅ Do</h3>
              <ul className="space-y-2 text-gray-700 text-sm">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Complete Authority Grove setup with all fields</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Add sameAs links for all social profiles</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Run audits monthly to track improvements</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Address critical recommendations first</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Monitor AI Search Visibility metrics</span>
                </li>
              </ul>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">❌ Don't</h3>
              <ul className="space-y-2 text-gray-700 text-sm">
                <li className="flex items-start">
                  <span className="text-red-500 mr-2">✗</span>
                  <span>Skip Authority Grove configuration</span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mr-2">✗</span>
                  <span>Use invalid Site IDs in script tags</span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mr-2">✗</span>
                  <span>Ignore audit recommendations</span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mr-2">✗</span>
                  <span>Forget to verify schema injection</span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mr-2">✗</span>
                  <span>Neglect regular optimization cycles</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Troubleshooting */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Troubleshooting</h2>
          
          <div className="space-y-4">
            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Schemas Not Appearing</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm">
                <li>Check browser console for error messages</li>
                <li>Verify your Site ID is correct</li>
                <li>Ensure config endpoint is accessible</li>
                <li>Check that script tag is in the &lt;head&gt; section</li>
              </ul>
            </div>

            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Low Audit Scores</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm">
                <li>Complete Authority Grove configuration</li>
                <li>Add missing JSON-LD schemas</li>
                <li>Ensure Organization schema is present</li>
                <li>Add sameAs links to schemas</li>
                <li>Follow audit recommendations</li>
              </ul>
            </div>

            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Need More Help?</h3>
              <p className="text-gray-700 text-sm mb-3">
                Check out our comprehensive guides:
              </p>
              <ul className="space-y-2">
                <li>
                  <Link href="/docs" className="text-blue-600 hover:underline text-sm">
                    → Documentation
                  </Link>
                </li>
                <li>
                  <a href="/AI_SEARCH_OPTIMIZATION.md" className="text-blue-600 hover:underline text-sm">
                    → AI Search Optimization Guide
                  </a>
                </li>
                <li>
                  <a href="/HOW_IT_WORKS.md" className="text-blue-600 hover:underline text-sm">
                    → How It Works (Technical)
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* CTA */}
        {!isAuthenticated && (
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-8 text-center text-white">
            <h2 className="text-2xl font-bold mb-3">Ready to Get Started?</h2>
            <p className="mb-6 text-blue-100">
              Create your account and start optimizing your website for AI search engines today.
            </p>
            <Link
              href="/login"
              className="inline-block bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              Get Started
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
