import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';
import { NextRequest } from 'next/server';

// Mock dependencies
vi.mock('@gpto/database', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
  },
}));

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
  getSiteIds: vi.fn(async () => ['site-1']),
}));

describe('GET /api/dashboard/confusion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return confusion data for valid request', async () => {
    const mockEvents = [
      {
        timestamp: new Date('2025-01-05'),
        eventType: 'search',
        sessionId: 'session-1',
        page: null,
        search: { query: 'test query' },
        context: null,
        siteId: 'site-1',
      },
      {
        timestamp: new Date('2025-01-06'),
        eventType: 'page_view',
        sessionId: 'session-1',
        page: { url: 'https://example.com/page1' },
        search: null,
        context: null,
        siteId: 'site-1',
      },
    ];

    const mockSelect = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(mockEvents),
      }),
    });

    vi.mocked(require('@gpto/database').db.select).mockReturnValue(mockSelect as any);

    const request = new NextRequest('http://localhost/api/dashboard/confusion?range=7d', {
      headers: {
        authorization: 'Bearer mock-token',
      },
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('totals');
    expect(data).toHaveProperty('signals');
    expect(data).toHaveProperty('confidence');
  });
});
