import { describe, it, expect } from 'vitest';
import { notificationText, notificationHref } from '../../app/api/notifications';
import type { Notification } from '../../app/api/notifications';

function makeNotif(type: string, payload: Record<string, unknown> = {}): Notification {
  return {
    id: 'n-1',
    user_id: 'u-1',
    type,
    payload,
    read_at: null,
    created_at: new Date().toISOString(),
  };
}

describe('notificationText', () => {
  it('returns "Сделка состоялась" for sold outcome', () => {
    expect(notificationText(makeNotif('reservation_outcome_marked', { outcome: 'sold' })))
      .toBe('Сделка состоялась');
  });

  it('returns "Сделка не состоялась" for not_sold outcome', () => {
    expect(notificationText(makeNotif('reservation_outcome_marked', { outcome: 'not_sold' })))
      .toBe('Сделка не состоялась');
  });

  it('returns base label for reservation_outcome_marked without outcome', () => {
    expect(notificationText(makeNotif('reservation_outcome_marked')))
      .toBe('Результат сделки отмечен');
  });

  it('returns label for reservation_cancelled_by_buyer', () => {
    expect(notificationText(makeNotif('reservation_cancelled_by_buyer')))
      .toBe('Покупатель отменил бронь');
  });

  it('appends reason for reservation_declined_by_seller', () => {
    const text = notificationText(
      makeNotif('reservation_declined_by_seller', { reason: 'Уже продано' })
    );
    expect(text).toContain('Продавец отклонил бронь');
    expect(text).toContain('Уже продано');
  });

  it('returns base label for reservation_declined_by_seller without reason', () => {
    expect(notificationText(makeNotif('reservation_declined_by_seller')))
      .toBe('Продавец отклонил бронь');
  });

  it('formats unknown notification type by replacing underscores with spaces', () => {
    const text = notificationText(makeNotif('some_unknown_event'));
    expect(text).toBe('some unknown event');
  });
});

describe('notificationHref', () => {
  it('always returns /profile?tab=reservations', () => {
    const types = [
      'reservation_outcome_marked',
      'reservation_cancelled_by_buyer',
      'reservation_declined_by_seller',
      'unknown_type',
    ];
    for (const type of types) {
      expect(notificationHref(makeNotif(type))).toBe('/profile?tab=reservations');
    }
  });
});
