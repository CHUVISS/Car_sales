import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../api/client';

const STORAGE_KEY = 'car_favorites';

function readIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function writeIds(ids: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
}

function hasToken(): boolean {
  return Boolean(localStorage.getItem('access_token'));
}

interface ServerListing {
  id: string;
  [key: string]: unknown;
}

export function useFavorites() {
  const [ids, setIds] = useState<string[]>(() => readIds());
  const synced = useRef(false);

  // При монтировании, если пользователь авторизован — синхронизируем с бэкендом
  useEffect(() => {
    if (synced.current || !hasToken()) return;
    synced.current = true;

    api
      .get<ServerListing[]>('/favorites')
      .then((listings) => {
        const backendIds = listings.map((l) => l.id);
        const localIds = readIds();

        // Отправляем на сервер те, что есть только локально
        const localOnly = localIds.filter((id) => !backendIds.includes(id));
        localOnly.forEach((id) => {
          api.post('/favorites', { listing_id: id }).catch(() => {});
        });

        const merged = [...new Set([...backendIds, ...localIds])];
        writeIds(merged);
        setIds(merged);
      })
      .catch(() => {
        // Нет доступа — продолжаем с localStorage
      });
  }, []);

  // Синхронизация между вкладками
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setIds(readIds());
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const toggle = useCallback((id: string) => {
    setIds((prev) => {
      const isCurrentlyFav = prev.includes(id);
      const next = isCurrentlyFav
        ? prev.filter((x) => x !== id)
        : [...prev, id];
      writeIds(next);

      if (hasToken()) {
        if (isCurrentlyFav) {
          api.delete(`/favorites/${id}`).catch(() => {});
        } else {
          api.post('/favorites', { listing_id: id }).catch(() => {});
        }
      }

      return next;
    });
  }, []);

  const isFavorite = useCallback((id: string) => ids.includes(id), [ids]);

  const clear = useCallback(() => {
    const current = readIds();
    if (hasToken()) {
      current.forEach((id) => api.delete(`/favorites/${id}`).catch(() => {}));
    }
    writeIds([]);
    setIds([]);
  }, []);

  return { ids, isFavorite, toggle, clear };
}
