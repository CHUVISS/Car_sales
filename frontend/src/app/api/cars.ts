import { api } from './client';

export type FuelType = 'petrol' | 'diesel' | 'electric' | 'hybrid' | 'gas';
export type Transmission = 'manual' | 'automatic' | 'robot' | 'variator';
export type BodyType = 'sedan' | 'hatchback' | 'suv' | 'coupe' | 'convertible' | 'wagon' | 'minivan' | 'pickup';
export type CarStatus = 'available' | 'reserved' | 'sold' | 'inactive';

export interface CarImage {
  id: string;
  url: string;
  thumb_url: string;
  is_primary: boolean;
  sort_order: number;
}

export interface Car {
  id: string;
  brand: string;
  model: string;
  year: number;
  vin: string | null;
  color: string | null;
  mileage: number;
  price: string;
  fuel_type: FuelType | null;
  transmission: Transmission | null;
  body_type: BodyType | null;
  engine_volume: string | null;
  engine_power: number | null;
  description: string | null;
  status: CarStatus;
  created_at: string;
  images: CarImage[];
}

export interface CarsPublic {
  data: Car[];
  count: number;
}

export interface CarFilters {
  brand?: string;
  model?: string;
  color?: string; // ✅ Добавлено
  year_from?: number;
  year_to?: number;
  price_from?: number;
  price_to?: number;
  mileage_from?: number;
  mileage_to?: number;
  fuel_type?: FuelType;
  transmission?: Transmission;
  body_type?: BodyType;
  status?: CarStatus;
  skip?: number;
  limit?: number;
  sort_by?: 'price_asc' | 'price_desc' | 'year_asc' | 'year_desc' | 'mileage_asc' | 'mileage_desc' | 'date_desc' | 'date_asc';
}

function buildQuery(filters: CarFilters): string {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value));
    }
  });
  const str = params.toString();
  return str ? `?${str}` : '';
}

export const carsApi = {
  list: (filters: CarFilters = {}) =>
    api.get<CarsPublic>(`/cars${buildQuery(filters)}`),

  get: (id: string) =>
    api.get<Car>(`/cars/${id}`),

  getImages: (id: string) =>
    api.get<CarImage[]>(`/cars/${id}/images`),
};