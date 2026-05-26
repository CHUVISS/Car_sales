const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/v1';

function authHeaders(): HeadersInit {
  const token = localStorage.getItem('access_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function req<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { ...authHeaders(), ...options?.headers },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Ошибка сервера' }));
    throw new Error(err.detail ?? 'Ошибка');
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// Types

export type UserRole = 'admin' | 'manager' | 'support' | 'user';
export type UserStatus = 'active' | 'inactive' | 'banned';
export type CarStatus = 'available' | 'reserved' | 'sold' | 'inactive';
export type CarOfferStatus = 'pending' | 'approved' | 'rejected';
export type MessageStatus = 'new' | 'in_progress' | 'resolved' | 'closed';
export type DealStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export interface AdminUser {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  phone: string | null;
  created_at: string;
}

export interface AdminCar {
  id: string;
  brand: string;
  model: string;
  year: number;
  price: string;
  mileage: number;
  status: CarStatus;
  fuel_type: string | null;
  transmission: string | null;
  body_type: string | null;
  engine_volume: string | null;
  engine_power: number | null;
  color: string | null;
  vin: string | null;
  description: string | null;
  created_at: string;
  images: { id: string; url: string; thumb_url: string; is_primary: boolean; sort_order: number }[];
}

export interface AdminCarOffer {
  id: string;
  user_id: string;
  brand: string;
  model: string;
  year: number;
  price: string;
  mileage: number;
  status: CarOfferStatus;
  rejection_reason: string | null;
  created_at: string;
  images: { id: string; url: string; thumb_url: string; is_primary: boolean; sort_order: number }[];
}

export interface AdminMessage {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  body: string;
  message_type: string;
  status: MessageStatus;
  car_id: string | null;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminDeal {
  id: string;
  deal_date: string;
  amount: string;
  payment_method: string;
  status: DealStatus;
  notes: string | null;
  car_id: string;
  client_id: string;
  manager_id: string;
  created_at: string;
}

export interface DashboardStats {
  total_cars: number;
  available_cars: number;
  sold_cars: number;
  reserved_cars: number;
  total_clients: number;
  total_deals: number;
  completed_deals: number;
  pending_deals: number;
  total_revenue: string;
  new_messages: number;
  total_viewings: number;
  pending_offers: number;
  total_offers: number;
}

export interface UserCreate {
  full_name: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface UserUpdate {
  full_name?: string;
  email?: string;
  role?: UserRole;
  status?: UserStatus;
  password?: string;
}

export interface CarCreate {
  brand: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  color?: string;
  fuel_type?: string;
  transmission?: string;
  body_type?: string;
  engine_volume?: number;
  engine_power?: number;
  description?: string;
  vin?: string;
}

// API calls

export const adminApi = {
  // Stats
  getStats: () => req<DashboardStats>('/admin/stats'),

  // Users
  getUsers: (skip = 0, limit = 20) =>
    req<{ data: AdminUser[]; count: number }>(`/admin/users?skip=${skip}&limit=${limit}`),
  createUser: (body: UserCreate) =>
    req<AdminUser>('/admin/users', { method: 'POST', body: JSON.stringify(body) }),
  updateUser: (id: string, body: UserUpdate) =>
    req<AdminUser>(`/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteUser: (id: string) =>
    req<void>(`/admin/users/${id}`, { method: 'DELETE' }),

  // Cars
  getCars: (skip = 0, limit = 20) =>
    req<{ data: AdminCar[]; count: number }>(`/cars?skip=${skip}&limit=${limit}`),
  createCar: (body: CarCreate) =>
    req<AdminCar>('/cars', { method: 'POST', body: JSON.stringify(body) }),
  updateCar: (id: string, body: Partial<CarCreate> & { status?: CarStatus }) =>
    req<AdminCar>(`/cars/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteCar: (id: string) =>
    req<void>(`/cars/${id}`, { method: 'DELETE' }),

  // Car offers (moderation)
  getOffers: (status?: CarOfferStatus, skip = 0, limit = 20) =>
    req<{ data: AdminCarOffer[]; count: number }>(
      `/car-offers?skip=${skip}&limit=${limit}${status ? `&status=${status}` : ''}`
    ),
  reviewOffer: (id: string, status: 'approved' | 'rejected', rejection_reason?: string) =>
    req<AdminCarOffer>(`/car-offers/${id}/review`, {
      method: 'PATCH',
      body: JSON.stringify({ status, rejection_reason }),
    }),

  // Messages
  getMessages: (status?: MessageStatus, skip = 0, limit = 20) =>
    req<{ data: AdminMessage[]; count: number }>(
      `/messages?skip=${skip}&limit=${limit}${status ? `&status=${status}` : ''}`
    ),
  updateMessage: (id: string, body: { status?: MessageStatus; assigned_to?: string }) =>
    req<AdminMessage>(`/messages/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),

  // Deals
  getDeals: (skip = 0, limit = 20) =>
    req<{ data: AdminDeal[]; count: number }>(`/deals?skip=${skip}&limit=${limit}`),

  // Car images upload (multipart — без Content-Type, браузер выставит boundary сам)
  uploadCarImages: async (id: string, formData: FormData): Promise<void> => {
    const token = localStorage.getItem('access_token');
    const res = await fetch(`${BASE_URL}/cars/${id}/images`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Ошибка загрузки' }));
      throw new Error(err.detail ?? 'Ошибка загрузки');
    }
  },
};