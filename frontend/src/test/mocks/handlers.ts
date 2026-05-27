import { http, HttpResponse } from 'msw';
import { mockUser, mockNotifications } from './fixtures';

const BASE = 'http://localhost:8000/api/v1';

export const handlers = [
  // ── Auth ─────────────────────────────────────────────────────────────────
  http.post(`${BASE}/auth/login`, () =>
    HttpResponse.json({
      access_token: 'test-access-token',
      refresh_token: 'test-refresh-token',
      token_type: 'bearer',
    }),
  ),
  http.post(`${BASE}/auth/register`, () =>
    HttpResponse.json(mockUser, { status: 201 }),
  ),
  http.get(`${BASE}/auth/me`, () =>
    HttpResponse.json(mockUser),
  ),
  http.post(`${BASE}/auth/logout`, () =>
    HttpResponse.json({ message: 'Logged out' }),
  ),

  // ── Notifications ────────────────────────────────────────────────────────
  http.get(`${BASE}/notifications`, () =>
    HttpResponse.json(mockNotifications),
  ),
  http.post(`${BASE}/notifications/:id/read`, () =>
    HttpResponse.json({ read: true }),
  ),
  http.post(`${BASE}/notifications/read-all`, () =>
    HttpResponse.json({ marked_read: 2 }),
  ),

  // ── Favorites ────────────────────────────────────────────────────────────
  http.get(`${BASE}/favorites`, () =>
    HttpResponse.json([]),
  ),
  http.post(`${BASE}/favorites`, () =>
    HttpResponse.json({ id: 'fav-1' }, { status: 201 }),
  ),
  http.delete(`${BASE}/favorites/:id`, () =>
    new HttpResponse(null, { status: 204 }),
  ),

  // ── Listings ─────────────────────────────────────────────────────────────
  http.get(`${BASE}/listings/my`, () =>
    HttpResponse.json([]),
  ),
  http.post(`${BASE}/listings`, () =>
    HttpResponse.json({ id: 'new-listing-1' }, { status: 201 }),
  ),

  // ── Reservations ─────────────────────────────────────────────────────────
  http.get(`${BASE}/reservations/my`, () =>
    HttpResponse.json([]),
  ),
  http.post(`${BASE}/reservations`, () =>
    HttpResponse.json({
      reservation_id: 'res-1',
      payment_url: 'https://pay.yookassa.ru/test',
    }),
  ),

  // ── Catalog ──────────────────────────────────────────────────────────────
  http.get(`${BASE}/catalog/marks`, () =>
    HttpResponse.json([
      { id: 'TOYOTA', name: 'TOYOTA', cyrillic_name: 'Тойота', popular: true },
      { id: 'BMW', name: 'BMW', cyrillic_name: 'БМВ', popular: true },
    ]),
  ),
  http.get(`${BASE}/catalog/colors`, () =>
    HttpResponse.json([
      { id: 'white', name_ru: 'Белый', name_en: 'White', hex_code: '#FFFFFF' },
      { id: 'black', name_ru: 'Чёрный', name_en: 'Black', hex_code: '#000000' },
    ]),
  ),
  http.get(`${BASE}/geo/cities`, () =>
    HttpResponse.json([
      { id: 'moscow', name_ru: 'Москва', name_en: 'Moscow' },
      { id: 'spb', name_ru: 'Санкт-Петербург', name_en: 'Saint Petersburg' },
    ]),
  ),
];
