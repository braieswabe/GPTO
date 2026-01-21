'use client';

import { useState } from 'react';

interface ConfigEditorProps {
  initialConfig: unknown;
  onSubmit: (config: unknown) => Promise<void>;
  onCancel?: () => void;
}

export function ConfigEditor({ initialConfig, onSubmit, onCancel }: ConfigEditorProps) {
  const [config, setConfig] = useState(() => JSON.stringify(initialConfig, null, 2));
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    try {
      setError(null);
      const parsed = JSON.parse(config);
      setIsSubmitting(true);
      await onSubmit(parsed);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid JSON');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Configuration JSON</label>
        <textarea
          value={config}
          onChange={(e) => setConfig(e.target.value)}
          className="w-full h-96 font-mono text-sm p-4 border rounded"
          placeholder='{"panthera_blackbox": {...}}'
        />
        {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? 'Submitting...' : 'Propose Update'}
        </button>
        {onCancel && (
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
