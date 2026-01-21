/**
 * Shared TypeScript types
 */

export type SiteStatus = 'active' | 'inactive' | 'pending' | 'error';

export type UserRole = 'admin' | 'operator' | 'viewer' | 'client';

export type UpdateStatus = 'pending' | 'approved' | 'applied' | 'rolled_back' | 'rejected';

export interface BaseEntity {
  id: string;
  created_at: Date;
  updated_at: Date;
}

export interface Tenant extends BaseEntity {
  name: string;
  domain?: string;
  status: SiteStatus;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
