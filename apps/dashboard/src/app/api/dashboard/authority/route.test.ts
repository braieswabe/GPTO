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
  extractMetrics: (events: Array<Record<string, unknown>>, key: string) =>
    events
      .map((event) => (event.metrics as Record<string, unknown> | undefined)?.[key])
      .filter((value): value is number => typeof value === 'number'),
}));

describe('GET /api/dashboard/authority', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return authority data for valid request', async () => {
    const mockEvents = [
      {
        metrics: { 'ts.authority': 0.75, 'ai.authoritySignals': 0.8 },
      },
      {
        metrics: { 'ts.authority': 0.85, 'ai.schemaCompleteness': 0.9 },
      },
    ];

    const mockSelect = (result: unknown) => ({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(result),
      }),
    });
    const mockSelectWithOrderBy = (result: unknown) => ({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockResolvedValue(result),
        }),
      }),
    });

    vi.mocked(db.select)
      .mockReturnValueOnce(mockSelect(mockEvents) as any)
      .mockReturnValueOnce(mockSelectWithOrderBy([]) as any);

    const request = new NextRequest('http://localhost/api/dashboard/authority?range=7d', {
      headers: {
        authorization: 'Bearer mock-token',
      },
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('authorityScore');
    expect(data).toHaveProperty('trustSignals');
    expect(data).toHaveProperty('confidence');
  });
});
