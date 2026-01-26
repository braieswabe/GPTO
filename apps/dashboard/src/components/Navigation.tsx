'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export function Navigation() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  // Always call hooks unconditionally (Rules of Hooks)
  // Navigation is always inside AuthProvider, so useAuth is safe
  const { isAuthenticated, logout, user } = useAuth();
  
  useEffect(() => {
    setMounted(true);
  }, []);

  const publicNavItems = [
    { href: '/', label: 'Home' },
    { href: '/install', label: 'How to Install' },
    { href: '/docs', label: 'Documentation' },
  ];

  const protectedNavItems = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/sites', label: 'Sites' },
    { href: '/chat', label: 'PantheraChat' },
    { href: '/settings', label: 'Settings' },
  ];

  const navItems = isAuthenticated 
    ? [...publicNavItems, ...protectedNavItems]
    : publicNavItems;

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-2xl font-bold text-blue-600">
                GPTO Suite
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      isActive
                        ? 'border-blue-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {mounted && isAuthenticated ? (
              <>
                <div className="hidden sm:block text-sm text-gray-600">
                  {user?.email}
                </div>
                <button
                  onClick={logout}
                  className="hidden sm:block px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  Logout
                </button>
              </>
            ) : mounted ? (
              <Link
                href="/login"
                className="hidden sm:block px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                Login
              </Link>
            ) : (
              <div className="hidden sm:block w-16 h-8"></div>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="sm:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            >
              <svg
                className="h-6 w-6"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 24 24"
              >
                {mobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="sm:hidden">
          <div className="pt-2 pb-3 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                    isActive
                      ? 'bg-blue-50 border-blue-500 text-blue-700'
                      : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              );
            })}
            {mounted && isAuthenticated ? (
              <>
                <div className="px-3 py-2 text-sm text-gray-600 border-t border-gray-200 mt-2 pt-2">
                  {user?.email}
                </div>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="block w-full text-left pl-3 pr-4 py-2 text-base font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                >
                  Logout
                </button>
              </>
            ) : mounted ? (
              <Link
                href="/login"
                className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-blue-600 hover:bg-gray-50 hover:text-blue-700"
                onClick={() => setMobileMenuOpen(false)}
              >
                Login
              </Link>
            ) : null}
          </div>
        </div>
      )}
    </nav>
  );
}
