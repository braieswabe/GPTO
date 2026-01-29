import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';
import { NextRequest } from 'next/server';
import { db } from '@gpto/database';
import { telemetryEvents } from '@gpto/database/src/schema';
import { getSiteIds } from '@/lib/dashboard-helpers';

// Mock dependencies
vi.mock('@gpto/database', () => ({
  db: {
    select: vi.fn(),
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
  getSiteIds: vi.fn(async () => ['site-1', 'site-2']),
}));

describe('GET /api/dashboard/telemetry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return telemetry data for valid request', async () => {
    const mockEvents = [
      {
        timestamp: new Date('2025-01-05'),
        eventType: 'page_view',
        sessionId: 'session-1',
        page: { url: 'https://example.com/page1' },
        context: null,
      },
      {
        timestamp: new Date('2025-01-06'),
        eventType: 'search',
        sessionId: 'session-1',
        page: null,
        context: null,
      },
    ];
    const mockSelect = (result: unknown) => ({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(result),
      }),
    });
    vi.mocked(db.select)
      .mockReturnValueOnce(mockSelect(mockEvents) as any)
      .mockReturnValueOnce(mockSelect([]) as any);

    const request = new NextRequest('http://localhost/api/dashboard/telemetry?range=7d', {
      headers: {
        authorization: 'Bearer mock-token',
      },
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('range');
    expect(data).toHaveProperty('totals');
    expect(data).toHaveProperty('series');
  });

  it('should prefer periodic aggregated counts over raw events', async () => {
    const mockEvents = [
      {
        timestamp: new Date('2025-01-05T10:00:00Z'),
        eventType: 'custom',
        sessionId: 'session-1',
        page: { url: 'https://example.com/page1' },
        context: {
          periodic: true,
          aggregated: { pageViews: 10, interactions: 4, searches: 2 },
          intent: 'demo',
        },
      },
      {
        timestamp: new Date('2025-01-05T10:01:00Z'),
        eventType: 'page_view',
        sessionId: 'session-1',
        page: { url: 'https://example.com/page1' },
        context: null,
      },
    ];
    const mockSelect = (result: unknown) => ({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(result),
      }),
    });
    vi.mocked(db.select)
      .mockReturnValueOnce(mockSelect(mockEvents) as any)
      .mockReturnValueOnce(mockSelect([]) as any);

    const request = new NextRequest('http://localhost/api/dashboard/telemetry?range=7d', {
      headers: {
        authorization: 'Bearer mock-token',
      },
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.totals.pageViews).toBe(10);
    expect(data.totals.interactions).toBe(4);
    expect(data.totals.searches).toBe(2);
    expect(data.topPages[0]).toMatchObject({ url: 'https://example.com/page1', count: 10 });
  });

  it('should handle empty site list', async () => {
    vi.mocked(getSiteIds).mockResolvedValue([]);

    const request = new NextRequest('http://localhost/api/dashboard/telemetry?range=7d', {
      headers: {
        authorization: 'Bearer mock-token',
      },
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.totals.visits).toBe(0);
    expect(data.totals.pageViews).toBe(0);
    expect(data.series).toEqual([]);
  });
});
