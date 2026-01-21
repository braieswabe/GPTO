'use client';

interface Change {
  path: string;
  operation: 'add' | 'remove' | 'replace' | 'move' | 'copy';
  value?: unknown;
  old_value?: unknown;
}

interface DiffViewProps {
  changes: Change[];
}

export function DiffView({ changes }: DiffViewProps) {
  if (changes.length === 0) {
    return <p className="text-gray-500">No changes</p>;
  }

  return (
    <div className="space-y-2">
      <h3 className="font-semibold">Changes ({changes.length})</h3>
      <div className="space-y-1">
        {changes.map((change, index) => (
          <div
            key={index}
            className={`p-2 rounded text-sm ${
              change.operation === 'add'
                ? 'bg-green-50 border-l-4 border-green-500'
                : change.operation === 'remove'
                ? 'bg-red-50 border-l-4 border-red-500'
                : 'bg-yellow-50 border-l-4 border-yellow-500'
            }`}
          >
            <div className="font-mono font-semibold">{change.operation.toUpperCase()}</div>
            <div className="text-gray-600">Path: {change.path}</div>
            {change.old_value !== undefined && (
              <div className="text-red-600">
                Old: {JSON.stringify(change.old_value)}
              </div>
            )}
            {change.value !== undefined && (
              <div className="text-green-600">
                New: {JSON.stringify(change.value)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
