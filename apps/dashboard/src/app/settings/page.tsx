'use client';

import { ExportButton } from '@/components/ExportButton';

export default function SettingsPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>

      <div className="space-y-8">
        <section>
          <h2 className="text-xl font-semibold mb-4">Data Export</h2>
          <div className="space-y-2">
            <div className="flex items-center gap-4">
              <span>Audit Log</span>
              <ExportButton type="audit" format="csv" />
              <ExportButton type="audit" format="json" />
            </div>
            <div className="flex items-center gap-4">
              <span>Telemetry</span>
              <ExportButton type="telemetry" format="csv" />
              <ExportButton type="telemetry" format="json" />
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">API Keys</h2>
          <p className="text-gray-600">Manage your API keys for external services</p>
          {/* Would implement API key management UI */}
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">Notifications</h2>
          <p className="text-gray-600">Configure notification preferences</p>
          {/* Would implement notification settings */}
        </section>
      </div>
    </div>
  );
}
