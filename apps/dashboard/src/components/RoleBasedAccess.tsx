'use client';

import { UserRole } from '@gpto/shared';

interface RoleBasedAccessProps {
  userRole: UserRole;
  allowedRoles: UserRole[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function RoleBasedAccess({
  userRole,
  allowedRoles,
  children,
  fallback,
}: RoleBasedAccessProps) {
  if (!allowedRoles.includes(userRole)) {
    return fallback || <div className="text-gray-500">Access denied</div>;
  }

  return <>{children}</>;
}
