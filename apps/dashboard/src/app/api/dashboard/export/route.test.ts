import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';
import { NextRequest } from 'next/server';

// Mock dependencies
vi.mock('@gpto/api', () => ({
  extractToken: vi.fn(() => 'mock-token'),
  verifyToken: vi.fn(),
}));

vi.mock('@/lib/dashboard-helpers', () => ({
  parseDateRange: vi.fn(() => ({
    start: new Date('2025-01-01'),
    end: new Date('2025-01-08'),
    rangeKey: '7d',
  })),
  requireAuth: vi.fn(),
}));

// Mock fetch
global.fetch = vi.fn();

describe('GET /api/dashboard/export', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    vi.mocked(global.fetch).mockImplementation((url) => {
      const urlStr = String(url);
      if (urlStr.includes('telemetry')) {
        return Promise.resolve({
          json: () => Promise.resolve({ totals: { visits: 100, pageViews: 200 } }),
        } as Response);
      }
      if (urlStr.includes('authority')) {
        return Promise.resolve({
          json: () => Promise.resolve({ authorityScore: 75 }),
        } as Response);
      }
      return Promise.resolve({
        json: () => Promise.resolve({}),
      } as Response);
    });
  });

  it('should return JSON export by default', async () => {
    const request = new NextRequest('http://localhost/api/dashboard/export?format=json', {
      headers: {
        authorization: 'Bearer mock-token',
      },
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('application/json');
    expect(data).toHaveProperty('generatedAt');
    expect(data).toHaveProperty('telemetry');
  });

  it('should return PDF export when format=pdf', async () => {
    const request = new NextRequest('http://localhost/api/dashboard/export?format=pdf', {
      headers: {
        authorization: 'Bearer mock-token',
      },
    });

    const response = await GET(request);
    const buffer = await response.arrayBuffer();

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('application/pdf');
    expect(buffer.byteLength).toBeGreaterThan(0);
  });
});
