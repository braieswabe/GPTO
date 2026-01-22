'use client';

import { ExportButton } from '@/components/ExportButton';
import { ProtectedRoute } from '@/components/ProtectedRoute';

function SettingsPageContent() {
  return (
    <div className="bg-white min-h-screen">
      <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="mt-2 text-gray-600">Manage your account and application preferences</p>
      </div>

      <div className="space-y-6">
        <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Data Export</h2>
          <p className="text-sm text-gray-600 mb-4">Export your data in various formats for backup or analysis</p>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <span className="font-medium text-gray-900">Audit Log</span>
                <p className="text-sm text-gray-500">Export audit trail and compliance records</p>
              </div>
              <div className="flex gap-2">
                <ExportButton type="audit" format="csv" />
                <ExportButton type="audit" format="json" />
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <span className="font-medium text-gray-900">Telemetry</span>
                <p className="text-sm text-gray-500">Export telemetry events and metrics</p>
              </div>
              <div className="flex gap-2">
                <ExportButton type="telemetry" format="csv" />
                <ExportButton type="telemetry" format="json" />
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">API Keys</h2>
          <p className="text-gray-600 mb-4">Manage your API keys for external services</p>
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              API key management is configured via environment variables. Contact your administrator to update keys.
            </p>
          </div>
        </section>

        <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Notifications</h2>
          <p className="text-gray-600 mb-4">Configure notification preferences</p>
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-sm text-gray-600">
              Notification settings will be available in a future update.
            </p>
          </div>
        </section>
      </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <SettingsPageContent />
    </ProtectedRoute>
  );
}
