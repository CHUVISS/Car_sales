import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFavorites } from '../../app/hooks/useFavorites';

const STORAGE_KEY = 'car_favorites';

beforeEach(() => {
  localStorage.clear();
});

describe('useFavorites — initial state', () => {
  it('starts empty when localStorage is empty', () => {
    const { result } = renderHook(() => useFavorites());
    expect(result.current.ids).toEqual([]);
  });

  it('loads IDs from localStorage on mount', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(['car-1', 'car-2']));
    const { result } = renderHook(() => useFavorites());
    expect(result.current.ids).toContain('car-1');
    expect(result.current.ids).toContain('car-2');
  });

  it('handles corrupted localStorage without crashing', () => {
    localStorage.setItem(STORAGE_KEY, 'not-valid-json');
    expect(() => renderHook(() => useFavorites())).not.toThrow();
  });
});

describe('useFavorites — isFavorite', () => {
  it('returns true for a stored ID', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(['car-42']));
    const { result } = renderHook(() => useFavorites());
    expect(result.current.isFavorite('car-42')).toBe(true);
  });

  it('returns false for an unknown ID', () => {
    const { result } = renderHook(() => useFavorites());
    expect(result.current.isFavorite('car-99')).toBe(false);
  });
});

describe('useFavorites — toggle', () => {
  it('adds an ID when it was not a favorite', () => {
    const { result } = renderHook(() => useFavorites());
    act(() => { result.current.toggle('car-5'); });
    expect(result.current.ids).toContain('car-5');
  });

  it('removes an ID when it was already a favorite', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(['car-5']));
    const { result } = renderHook(() => useFavorites());
    act(() => { result.current.toggle('car-5'); });
    expect(result.current.ids).not.toContain('car-5');
  });

  it('persists to localStorage after toggle', () => {
    const { result } = renderHook(() => useFavorites());
    act(() => { result.current.toggle('car-7'); });
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    expect(stored).toContain('car-7');
  });
});

describe('useFavorites — clear', () => {
  it('removes all favorites and clears localStorage', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(['car-1', 'car-2']));
    const { result } = renderHook(() => useFavorites());
    act(() => { result.current.clear(); });
    expect(result.current.ids).toEqual([]);
    expect(localStorage.getItem(STORAGE_KEY)).toBe('[]');
  });
});
