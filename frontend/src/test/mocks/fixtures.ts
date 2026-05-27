import type { Notification } from '../../app/api/notifications';
import type { Reservation } from '../../app/api/reservations';

export const mockUser = {
  id: 'user-1',
  full_name: 'Иван Иванов',
  email: 'ivan@example.com',
  role: 'user' as const,
  status: 'active' as const,
  phone: '+79001234567',
  created_at: '2024-01-01T00:00:00Z',
};

export const mockNotifications: Notification[] = [
  {
    id: 'notif-1',
    user_id: 'user-1',
    type: 'reservation_outcome_marked',
    payload: { outcome: 'sold' },
    read_at: null,
    created_at: '2024-01-10T12:00:00Z',
  },
  {
    id: 'notif-2',
    user_id: 'user-1',
    type: 'reservation_cancelled_by_buyer',
    payload: {},
    read_at: '2024-01-11T08:00:00Z',
    created_at: '2024-01-11T07:00:00Z',
  },
  {
    id: 'notif-3',
    user_id: 'user-1',
    type: 'reservation_declined_by_seller',
    payload: { reason: 'Автомобиль уже продан' },
    read_at: null,
    created_at: '2024-01-12T09:00:00Z',
  },
];

export const mockReservation: Reservation = {
  id: 'res-1',
  listing_id: 'listing-1',
  buyer_id: 'user-1',
  seller_id: 'seller-2',
  deposit_amount: 5000,
  yk_payment_id: null,
  status: 'pending_payment',
  outcome: null,
  outcome_set_by: null,
  outcome_set_at: null,
  cancel_reason: null,
  payment_deadline: '2024-01-20T12:00:00Z',
  hold_deadline: '2024-01-27T12:00:00Z',
  correction_deadline: null,
  created_at: '2024-01-15T10:00:00Z',
  updated_at: '2024-01-15T10:00:00Z',
};

export const mockCar = {
  id: '1',
  brand: 'Toyota',
  model: 'Camry',
  year: 2022,
  price: 2500000,
  mileage: 30000,
  transmission: 'automatic' as const,
  fuel: 'petrol' as const,
  color: 'Белый',
  engineVolume: 2.5,
  drive: 'front' as const,
  body: 'sedan' as const,
  power: 181,
  images: ['1'],
  description: 'Хорошее состояние',
  isNew: false,
  createdAt: '2024-01-01T00:00:00Z',
  status: 'available' as const,
};
