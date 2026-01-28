import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';
import { NextRequest } from 'next/server';
import { db } from '@gpto/database';
import { telemetryEvents } from '@gpto/database/src/schema';

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

    const mockSelect = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(mockEvents),
      }),
    });

    vi.mocked(db.select).mockReturnValue(mockSelect as any);

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

  it('should handle empty site list', async () => {
    vi.mocked(require('@/lib/dashboard-helpers').getSiteIds).mockResolvedValue([]);

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
