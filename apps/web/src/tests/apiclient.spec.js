import { describe, it, expect, vi, beforeEach } from 'vitest';

// Force mocks before EVERYTHING
globalThis.localStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

globalThis.fetch = vi.fn();

describe('APIClient Unit Tests', () => {
  let apiClient;

  beforeEach(async () => {
    // Dynamic import to ensure global mocks are ready
    const module = await import('../core/APIClient.js');
    apiClient = module.apiClient;
    vi.clearAllMocks();
  });

  it('should retry on 500 server error up to maxRetries', async () => {
    globalThis.fetch.mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error'
    });

    apiClient.baseDelay = 1;
    apiClient.maxRetries = 2;

    try {
      await apiClient.get('/test');
    } catch (err) {}

    expect(globalThis.fetch).toHaveBeenCalledTimes(3);
  });

  it('should not retry on 400 client error', async () => {
    globalThis.fetch.mockResolvedValue({
      ok: false,
      status: 400,
      statusText: 'Bad Request'
    });

    apiClient.maxRetries = 3;
    const res = await apiClient.get('/test');

    expect(res.status).toBe(400);
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });

  it('should retry on network errors (TypeError)', async () => {
    globalThis.fetch.mockRejectedValue(new TypeError('Failed to fetch'));

    apiClient.baseDelay = 1;
    apiClient.maxRetries = 2;

    try {
      await apiClient.get('/network-fail');
    } catch (err) {}

    expect(globalThis.fetch).toHaveBeenCalledTimes(3);
  });

  it('should succeed if a retry eventually works', async () => {
    globalThis.fetch
      .mockResolvedValueOnce({ ok: false, status: 503 })
      .mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve({ data: 'ok' }) });

    apiClient.baseDelay = 1;
    const res = await apiClient.get('/eventual-success');
    const data = await res.json();

    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
    expect(data.data).toBe('ok');
  });
});
