import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { NextRequest } from 'next/server';
import { db } from '@gpto/database';

// Mock dependencies
vi.mock('@gpto/database', () => ({
  db: {
    select: vi.fn(),
  },
}));

// Mock fetch
global.fetch = vi.fn();

describe('POST /api/cron/refresh-rollups', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = 'test-secret';
    
    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockResolvedValue([
        { id: 'site-1' },
        { id: 'site-2' },
      ]),
    } as any);

    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    } as Response);
  });

  it('should refresh rollups for all sites', async () => {
    const request = new NextRequest('http://localhost/api/cron/refresh-rollups', {
      method: 'POST',
      headers: {
        authorization: 'Bearer test-secret',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('refreshed');
    expect(data.refreshed).toBe(2);
  });

  it('should reject unauthorized requests', async () => {
    const request = new NextRequest('http://localhost/api/cron/refresh-rollups', {
      method: 'POST',
      headers: {
        authorization: 'Bearer wrong-secret',
      },
    });

    const response = await POST(request);

    expect(response.status).toBe(401);
  });
});
