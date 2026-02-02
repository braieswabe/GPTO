'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    // Redirect client users away from non-Gold Dashboard routes
    if (!isLoading && isAuthenticated && user?.role === 'client') {
      const allowedPaths = ['/dashboard/gold', '/login', '/logout', '/'];
      const isAllowedPath = allowedPaths.some(path => pathname === path || pathname.startsWith('/dashboard/gold'));
      
      if (!isAllowedPath && pathname !== '/login') {
        router.replace('/dashboard/gold');
      }
    }
  }, [isAuthenticated, isLoading, user, pathname, router]);

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

  // Block client users from accessing non-Gold Dashboard routes
  if (user?.role === 'client') {
    const allowedPaths = ['/dashboard/gold', '/login', '/logout', '/'];
    const isAllowedPath = allowedPaths.some(path => pathname === path || pathname.startsWith('/dashboard/gold'));
    
    if (!isAllowedPath && pathname !== '/login') {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600">Redirecting to Gold Dashboard...</p>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}
