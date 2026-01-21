import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';

// Use system font stack instead of Google Fonts to avoid build-time network dependency
// This ensures builds work in environments without network access
const fontFamily = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

export const metadata: Metadata = {
  title: 'GPTO Suite - Safe, Declarative Website Updates',
  description: 'Control panel for GPTO Suite - Safe, declarative website updates powered by AI orchestration',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ fontFamily }} className="antialiased">
        <Providers>
          <div className="flex flex-col min-h-screen">
            <Navigation />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
