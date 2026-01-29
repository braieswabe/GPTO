import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';
import { NextRequest } from 'next/server';
import { db } from '@gpto/database';

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

    const mockSelect = (result: unknown) => ({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(result),
      }),
    });

    vi.mocked(db.select)
      .mockReturnValueOnce(mockSelect(mockEvents) as any)
      .mockReturnValueOnce(mockSelect([]) as any);

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

  it('should use periodic confusion context when available', async () => {
    const mockEvents = [
      {
        timestamp: new Date('2025-01-06'),
        eventType: 'custom',
        sessionId: 'session-1',
        page: { url: 'https://example.com/page1' },
        search: null,
        context: {
          periodic: true,
          confusion: {
            repeatedSearches: 2,
            deadEnds: 1,
            dropOffs: 1,
            repeatedSearchesDetail: [{ query: 'pricing', count: 2 }],
            deadEndsDetail: [{ url: 'https://example.com/page1', at: '2025-01-06T00:00:00Z' }],
            dropOffsDetail: [{ sessionId: 'session-9', lastEvent: '2025-01-06T00:01:00Z' }],
          },
        },
        siteId: 'site-1',
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

    const request = new NextRequest('http://localhost/api/dashboard/confusion?range=7d', {
      headers: {
        authorization: 'Bearer mock-token',
      },
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.totals.repeatedSearches).toBe(2);
    expect(data.totals.deadEnds).toBe(1);
    expect(data.totals.dropOffs).toBe(1);
    expect(data.signals.repeatedSearches[0]).toMatchObject({ query: 'pricing', count: 2 });
  });
});
