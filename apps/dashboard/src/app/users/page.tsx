'use client';

import { useState } from 'react';
import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { SiteAccessManager } from '@/components/SiteAccessManager';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@gpto/shared';

interface User {
  id: string;
  email: string;
  role: string;
  tenantId?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface UserWithSites extends User {
  sites: Array<{ id: string; domain: string }>;
}

interface Site {
  id: string;
  domain: string;
  status?: string | null;
}

function UsersPageContent() {
  const { user } = useAuth();
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    email: '',
    password: '',
    role: 'client',
    tenantId: '',
    siteIds: [] as string[],
  });
  const queryClient = useQueryClient();

  // Fetch all users
  const { data: usersData, isLoading, refetch } = useQuery<{ data: User[]; total: number }>({
    refetchOnWindowFocus: false,
    queryKey: ['all-users'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/users', {
        headers: {
          Authorization: `Bearer ${token || ''}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      return response.json();
    },
  });

  // Fetch sites for each user
  const { data: usersWithSites } = useQuery<UserWithSites[]>({
    queryKey: ['users-with-sites', usersData?.data],
    queryFn: async () => {
      if (!usersData?.data) return [];

      const token = localStorage.getItem('token');
      const users = usersData.data;

      const usersWithSitesPromises = users.map(async (user) => {
        const sitesResponse = await fetch(`/api/users/${user.id}/sites`, {
          headers: {
            Authorization: `Bearer ${token || ''}`,
          },
        });

        const sitesData = sitesResponse.ok ? await sitesResponse.json() : { data: [] };
        return {
          ...user,
          sites: sitesData.data || [],
        };
      });

      return Promise.all(usersWithSitesPromises);
    },
    enabled: !!usersData?.data,
  });

  // Fetch all sites for the create form
  const { data: allSitesData } = useQuery<{ data: Site[]; total: number }>({
    queryKey: ['all-sites'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/sites', {
        headers: {
          Authorization: `Bearer ${token || ''}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch sites');
      }

      return response.json();
    },
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (userData: typeof createFormData) => {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token || ''}`,
        },
        body: JSON.stringify({
          email: userData.email,
          password: userData.password,
          role: userData.role,
          tenantId: userData.tenantId || undefined,
          siteIds: userData.siteIds.length > 0 ? userData.siteIds : undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create user');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-users'] });
      queryClient.invalidateQueries({ queryKey: ['users-with-sites'] });
      setShowCreateForm(false);
      setCreateFormData({
        email: '',
        password: '',
        role: 'client',
        tenantId: '',
        siteIds: [],
      });
    },
  });

  if (!user || user.role !== 'admin') {
    return (
      <div className="p-8 bg-slate-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">Access denied. Admin role required.</p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-8 bg-slate-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  const users = usersWithSites || [];
  const allSites = allSitesData?.data || [];

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    createUserMutation.mutate(createFormData);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'operator':
        return 'bg-blue-100 text-blue-800';
      case 'client':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="mt-2 text-gray-600">Manage user access and site assignments</p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
        >
          {showCreateForm ? 'Cancel' : '+ Add User'}
        </button>
      </div>

      {showCreateForm && (
        <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Create New User</h2>
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  required
                  value={createFormData.email}
                  onChange={(e) => setCreateFormData({ ...createFormData, email: e.target.value })}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password * (min 8 characters)
                </label>
                <input
                  type="password"
                  id="password"
                  required
                  minLength={8}
                  value={createFormData.password}
                  onChange={(e) => setCreateFormData({ ...createFormData, password: e.target.value })}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                  Role *
                </label>
                <select
                  id="role"
                  required
                  value={createFormData.role}
                  onChange={(e) => setCreateFormData({ ...createFormData, role: e.target.value })}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="client">Client</option>
                  <option value="viewer">Viewer</option>
                  <option value="operator">Operator</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label htmlFor="tenantId" className="block text-sm font-medium text-gray-700 mb-1">
                  Tenant ID (optional)
                </label>
                <input
                  type="text"
                  id="tenantId"
                  value={createFormData.tenantId}
                  onChange={(e) => setCreateFormData({ ...createFormData, tenantId: e.target.value })}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="UUID"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assign Sites (optional)
              </label>
              <div className="border border-gray-200 rounded-lg p-4 max-h-48 overflow-y-auto">
                {allSites.length === 0 ? (
                  <p className="text-sm text-gray-600">No sites available</p>
                ) : (
                  <div className="space-y-2">
                    {allSites.map((site) => (
                      <label
                        key={`site-${site.id}`}
                        className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={createFormData.siteIds.includes(site.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setCreateFormData({
                                ...createFormData,
                                siteIds: [...createFormData.siteIds, site.id],
                              });
                            } else {
                              setCreateFormData({
                                ...createFormData,
                                siteIds: createFormData.siteIds.filter((id) => id !== site.id),
                              });
                            }
                          }}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-900">{site.domain}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
            {createUserMutation.isError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-800">
                  {createUserMutation.error instanceof Error
                    ? createUserMutation.error.message
                    : 'An error occurred'}
                </p>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setCreateFormData({
                    email: '',
                    password: '',
                    role: 'client',
                    tenantId: '',
                    siteIds: [],
                  });
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createUserMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createUserMutation.isPending ? 'Creating...' : 'Create User'}
              </button>
            </div>
          </form>
        </div>
      )}

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sites
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                      No users found
                    </td>
                  </tr>
                ) : (
                  users.map((userItem) => (
                    <React.Fragment key={userItem.id}>
                      <tr className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{userItem.email}</div>
                          <div className="text-xs text-gray-500">
                            Created: {new Date(userItem.createdAt).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(
                              userItem.role
                            )}`}
                          >
                            {userItem.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {userItem.sites.length} site{userItem.sites.length !== 1 ? 's' : ''}
                          {userItem.sites.length > 0 && (
                            <div className="text-xs text-gray-400 mt-1">
                              {userItem.sites.slice(0, 2).map((s) => s.domain).join(', ')}
                              {userItem.sites.length > 2 && '...'}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() =>
                              setExpandedUserId(expandedUserId === userItem.id ? null : userItem.id)
                            }
                            className="text-blue-600 hover:text-blue-900"
                          >
                            {expandedUserId === userItem.id ? 'Hide' : 'Manage Sites'}
                          </button>
                        </td>
                      </tr>
                      {expandedUserId === userItem.id && (
                        <tr>
                          <td colSpan={4} className="px-6 py-4 bg-gray-50">
                            <div className="max-w-3xl">
                              <h3 className="text-sm font-semibold text-gray-900 mb-4">
                                Manage Site Access for {userItem.email}
                              </h3>
                              <SiteAccessManager
                                userId={userItem.id}
                                currentSiteIds={userItem.sites.map((s) => s.id)}
                                onUpdate={() => {
                                  refetch();
                                }}
                              />
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function UsersPage() {
  return (
    <ProtectedRoute>
      <UsersPageContent />
    </ProtectedRoute>
  );
}
