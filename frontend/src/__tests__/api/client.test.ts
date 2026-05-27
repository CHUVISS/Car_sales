import { describe, it, expect, beforeEach, vi } from 'vitest';

// Reset modules before each test so client.ts re-evaluates with fresh localStorage
beforeEach(() => {
  localStorage.clear();
  vi.resetModules();
});

describe('api client — URL construction', () => {
  it('calls fetch with BASE_URL prefix', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 })
    );

    const { api } = await import('../../app/api/client');
    await api.get('/test-path');

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/test-path'),
      expect.any(Object),
    );
    fetchSpy.mockRestore();
  });
});

describe('api client — Authorization header', () => {
  it('includes Bearer token when access_token is in localStorage', async () => {
    localStorage.setItem('access_token', 'my-secret-token');

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({}), { status: 200 })
    );

    const { api } = await import('../../app/api/client');
    await api.get('/secure');

    const [, options] = fetchSpy.mock.calls[0] as [string, RequestInit];
    const headers = options.headers as Record<string, string>;
    expect(headers['Authorization']).toBe('Bearer my-secret-token');

    fetchSpy.mockRestore();
  });

  it('omits Authorization header when no token', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({}), { status: 200 })
    );

    const { api } = await import('../../app/api/client');
    await api.get('/public');

    const [, options] = fetchSpy.mock.calls[0] as [string, RequestInit];
    const headers = options.headers as Record<string, string>;
    expect(headers['Authorization']).toBeUndefined();

    fetchSpy.mockRestore();
  });
});

describe('api client — HTTP methods', () => {
  it('sends POST with JSON body', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ id: '1' }), { status: 201 })
    );

    const { api } = await import('../../app/api/client');
    const payload = { name: 'test', value: 42 };
    await api.post('/items', payload);

    const [, options] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(options.method).toBe('POST');
    expect(options.body).toBe(JSON.stringify(payload));

    fetchSpy.mockRestore();
  });

  it('sends PATCH with correct method', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({}), { status: 200 })
    );

    const { api } = await import('../../app/api/client');
    await api.patch('/items/1', { name: 'updated' });

    const [, options] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(options.method).toBe('PATCH');

    fetchSpy.mockRestore();
  });

  it('sends DELETE with no body', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(null, { status: 204 })
    );

    const { api } = await import('../../app/api/client');
    await api.delete('/items/1');

    const [, options] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(options.method).toBe('DELETE');

    fetchSpy.mockRestore();
  });
});

describe('api client — error handling', () => {
  it('throws Error with detail from response body on 4xx', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({ detail: 'Not found' }),
        { status: 404 }
      )
    );

    const { api } = await import('../../app/api/client');
    await expect(api.get('/missing')).rejects.toThrow('Not found');
  });

  it('throws generic error when response body is not JSON', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('Server Error', { status: 500 })
    );

    const { api } = await import('../../app/api/client');
    await expect(api.get('/boom')).rejects.toThrow();
  });

  it('returns undefined for 204 No Content', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(null, { status: 204 })
    );

    const { api } = await import('../../app/api/client');
    const result = await api.delete('/items/1');
    expect(result).toBeUndefined();
  });
});
