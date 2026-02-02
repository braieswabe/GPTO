'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Route protection for client users - redirects to Gold Dashboard if they try to access other routes
 */
export function ClientOnlyRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      // If user is a client and trying to access non-Gold Dashboard routes, redirect
      if (user.role === 'client') {
        const allowedPaths = ['/dashboard/gold', '/login', '/logout', '/'];
        const isAllowedPath = allowedPaths.some(path => pathname === path || pathname.startsWith('/dashboard/gold'));
        
        if (!isAllowedPath) {
          router.replace('/dashboard/gold');
        }
      }
    }
  }, [user, isLoading, isAuthenticated, pathname, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
