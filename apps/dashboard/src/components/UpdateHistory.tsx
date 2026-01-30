'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

interface Approval {
  id: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy: string | null;
  approvedAt: string | null;
  rejectedReason: string | null;
}

interface Update {
  id: string;
  fromVersion: string;
  toVersion: string;
  appliedAt: string | null;
  rolledBackAt: string | null;
  createdAt: string;
  approval: Approval | null;
}

interface UpdateHistoryProps {
  siteId: string;
  activeVersion: string | null;
}

async function fetchUpdates(siteId: string): Promise<Update[]> {
  const response = await fetch(`/api/sites/${siteId}/updates`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
    },
  });
  if (!response.ok) {
    throw new Error('Failed to fetch updates');
  }
  const data = await response.json();
  return data.data || [];
}

async function approveUpdate(approvalId: string, status: 'approved' | 'rejected', reason?: string) {
  const response = await fetch('/api/governance/approve', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
    },
    body: JSON.stringify({ approvalId, status, reason }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to process approval');
  }
  return response.json();
}

async function fetchConfigVersion(siteId: string, version: string) {
  // URL encode the version to handle special characters like dots
  const encodedVersion = encodeURIComponent(version);
  const response = await fetch(`/api/sites/${siteId}/versions/${encodedVersion}`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
    },
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch config version');
  }
  return response.json();
}

async function rollbackToVersion(siteId: string, targetVersion: string) {
  const response = await fetch(`/api/sites/${siteId}/rollback`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
    },
    body: JSON.stringify({ targetVersion }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to rollback');
  }
  return response.json();
}

export function UpdateHistory({ siteId, activeVersion }: UpdateHistoryProps) {
  const queryClient = useQueryClient();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rollbackTargetId, setRollbackTargetId] = useState<string | null>(null);
  const [comparisonModal, setComparisonModal] = useState<{
    show: boolean;
    update: Update | null;
    pastConfig: unknown | null;
    currentConfig: unknown | null;
    loading: boolean;
  }>({
    show: false,
    update: null,
    pastConfig: null,
    currentConfig: null,
    loading: false,
  });

  const { data: updates, isLoading } = useQuery({
    queryKey: ['updates', siteId],
    queryFn: () => fetchUpdates(siteId),
  });

  const approveMutation = useMutation({
    mutationFn: ({ approvalId, status, reason }: { approvalId: string; status: 'approved' | 'rejected'; reason?: string }) =>
      approveUpdate(approvalId, status, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['updates', siteId] });
      queryClient.invalidateQueries({ queryKey: ['site', siteId] });
      setProcessingId(null);
    },
    onError: () => {
      setProcessingId(null);
    },
  });

  const rollbackMutation = useMutation({
    mutationFn: (targetVersion: string) => rollbackToVersion(siteId, targetVersion),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['updates', siteId] });
      queryClient.invalidateQueries({ queryKey: ['site', siteId] });
      setRollbackTargetId(null);
    },
    onError: () => {
      setRollbackTargetId(null);
    },
  });

  const handleApprove = (approvalId: string) => {
    setProcessingId(approvalId);
    approveMutation.mutate({ approvalId, status: 'approved' });
  };

  const handleReject = (approvalId: string) => {
    const reason = prompt('Reason for rejection (optional):');
    setProcessingId(approvalId);
    approveMutation.mutate({ approvalId, status: 'rejected', reason: reason || undefined });
  };

  const handleRollbackClick = async (update: Update) => {
    // Fetch both configs for comparison
    setComparisonModal({
      show: true,
      update,
      pastConfig: null,
      currentConfig: null,
      loading: true,
    });

    try {
      // Fetch past config (fromVersion)
      const pastConfigData = await fetchConfigVersion(siteId, update.fromVersion);
      
      // Fetch current config (active version)
      const siteData = await queryClient.fetchQuery({
        queryKey: ['site', siteId],
        queryFn: async () => {
          const response = await fetch(`/api/sites/${siteId}`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
            },
          });
          if (!response.ok) throw new Error('Failed to fetch site');
          return response.json();
        },
      });

      setComparisonModal({
        show: true,
        update,
        pastConfig: pastConfigData.configJson,
        currentConfig: siteData.config,
        loading: false,
      });
    } catch (error) {
      console.error('Error fetching configs:', error);
      setComparisonModal({
        show: true,
        update,
        pastConfig: null,
        currentConfig: null,
        loading: false,
      });
    }
  };

  const handleConfirmRollback = () => {
    if (comparisonModal.update) {
      setRollbackTargetId(comparisonModal.update.id);
      rollbackMutation.mutate(comparisonModal.update.fromVersion);
      setComparisonModal({
        show: false,
        update: null,
        pastConfig: null,
        currentConfig: null,
        loading: false,
      });
    }
  };

  const handleCloseModal = () => {
    setComparisonModal({
      show: false,
      update: null,
      pastConfig: null,
      currentConfig: null,
      loading: false,
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <h3 className="font-semibold text-gray-900">Update History</h3>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 border border-gray-200 rounded-lg animate-pulse bg-gray-50">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!updates || updates.length === 0) {
    return (
      <div>
        <h3 className="font-semibold text-gray-900 mb-4">Update History</h3>
        <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
          <svg className="mx-auto h-12 w-12 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-gray-500">No updates yet</p>
          <p className="text-xs text-gray-400 mt-1">Update history will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-gray-900">Update History</h3>
      <div className="space-y-3">
        {updates.map((update) => (
          <div
            key={update.id}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors"
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="font-semibold text-gray-900 mb-1">
                  <span className="text-gray-600">{update.fromVersion}</span>
                  <span className="mx-2 text-gray-400">→</span>
                  <span className="text-blue-600">{update.toVersion}</span>
                </div>
                <div className="text-sm text-gray-500">
                  {new Date(update.createdAt).toLocaleString()}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {update.rolledBackAt ? (
                  <span className="px-3 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                    Rolled Back
                  </span>
                ) : update.appliedAt && update.toVersion === activeVersion ? (
                  <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                    Active
                  </span>
                ) : update.appliedAt ? (
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                      Applied
                    </span>
                    <button
                      onClick={() => handleRollbackClick(update)}
                      disabled={rollbackTargetId === update.id || rollbackMutation.isPending}
                      className="px-3 py-1 text-xs font-medium rounded-full bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      title={`Rollback to version ${update.fromVersion}`}
                    >
                      Rollback
                    </button>
                  </div>
                ) : update.approval?.status === 'rejected' ? (
                  <span className="px-3 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                    Rejected
                  </span>
                ) : update.approval?.status === 'approved' ? (
                  <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                    Approved
                  </span>
                ) : update.approval ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(update.approval!.id)}
                      disabled={processingId === update.approval!.id}
                      className="px-3 py-1 text-xs font-medium rounded-full bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {processingId === update.approval!.id ? 'Processing...' : 'Approve'}
                    </button>
                    <button
                      onClick={() => handleReject(update.approval!.id)}
                      disabled={processingId === update.approval!.id}
                      className="px-3 py-1 text-xs font-medium rounded-full bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                ) : (
                  <span className="px-3 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                    Pending
                  </span>
                )}
              </div>
            </div>
            {update.approval?.rejectedReason && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                Rejection reason: {update.approval.rejectedReason}
              </div>
            )}
            {rollbackMutation.isError && rollbackTargetId === update.id && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                Rollback failed: {rollbackMutation.error instanceof Error ? rollbackMutation.error.message : 'Unknown error'}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Comparison Modal */}
      {comparisonModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Rollback Comparison</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Compare past configuration (version {comparisonModal.update?.fromVersion}) with current configuration
                  </p>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-auto p-6">
              {comparisonModal.loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              ) : comparisonModal.pastConfig && comparisonModal.currentConfig ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Past Config */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">
                      Past Configuration (v{comparisonModal.update?.fromVersion})
                    </h4>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 overflow-auto max-h-[60vh]">
                      <pre className="text-xs font-mono text-gray-800 whitespace-pre-wrap">
                        {JSON.stringify(comparisonModal.pastConfig, null, 2)}
                      </pre>
                    </div>
                  </div>
                  
                  {/* Current Config */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">
                      Current Configuration (Active)
                    </h4>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 overflow-auto max-h-[60vh]">
                      <pre className="text-xs font-mono text-gray-800 whitespace-pre-wrap">
                        {JSON.stringify(comparisonModal.currentConfig, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">Failed to load configurations</p>
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRollback}
                disabled={!comparisonModal.pastConfig || rollbackMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {rollbackMutation.isPending ? 'Rolling back...' : 'Confirm Rollback'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
