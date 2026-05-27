import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { server } from '../../test/mocks/server';
import { http, HttpResponse } from 'msw';
import { mockUser } from '../../test/mocks/fixtures';

const BASE = 'http://localhost:8000/api/v1';

beforeEach(() => {
  localStorage.clear();
  vi.resetModules();
});

describe('useAuth — initial load', () => {
  it('returns null user and loading=false when no token in localStorage', async () => {
    const { useAuth } = await import('../../app/hooks/useAuth');
    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user).toBeNull();
  });

  it('loads user from /auth/me when access_token is present', async () => {
    localStorage.setItem('access_token', 'test-access-token');
    const { useAuth } = await import('../../app/hooks/useAuth');
    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user?.email).toBe(mockUser.email);
  });

  it('clears tokens and remains null when /auth/me returns 401', async () => {
    localStorage.setItem('access_token', 'expired-token');
    server.use(
      http.get(`${BASE}/auth/me`, () =>
        HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 })
      )
    );
    const { useAuth } = await import('../../app/hooks/useAuth');
    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user).toBeNull();
    expect(localStorage.getItem('access_token')).toBeNull();
  });
});

describe('useAuth — login', () => {
  it('stores tokens in localStorage after successful login', async () => {
    const { useAuth } = await import('../../app/hooks/useAuth');
    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.login('ivan@example.com', 'password123');
    });
    expect(localStorage.getItem('access_token')).toBe('test-access-token');
    expect(localStorage.getItem('refresh_token')).toBe('test-refresh-token');
  });

  it('sets user after login', async () => {
    const { useAuth } = await import('../../app/hooks/useAuth');
    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.login('ivan@example.com', 'password123');
    });
    await waitFor(() => expect(result.current.user).not.toBeNull());
    expect(result.current.user?.email).toBe(mockUser.email);
  });

  it('throws when login credentials are wrong', async () => {
    server.use(
      http.post(`${BASE}/auth/login`, () =>
        HttpResponse.json({ detail: 'Incorrect email or password' }, { status: 401 })
      )
    );
    const { useAuth } = await import('../../app/hooks/useAuth');
    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await expect(
      act(async () => { await result.current.login('bad@example.com', 'wrong'); })
    ).rejects.toThrow();
  });
});

describe('useAuth — logout', () => {
  it('clears tokens and user from state on logout', async () => {
    localStorage.setItem('access_token', 'test-access-token');
    localStorage.setItem('refresh_token', 'test-refresh-token');
    const { useAuth } = await import('../../app/hooks/useAuth');
    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.logout();
    });
    expect(result.current.user).toBeNull();
    expect(localStorage.getItem('access_token')).toBeNull();
    expect(localStorage.getItem('refresh_token')).toBeNull();
  });
});
