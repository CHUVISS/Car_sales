import { api } from './client';

export interface UserViewingCreate {
  car_id: string;
  viewing_date: string;
  viewing_time: string;
  comment?: string;
}

export interface ViewingPublic {
  id: string;
  viewing_date: string;
  viewing_time: string | null;
  result: string;
  comment: string | null;
  client_id: string;
  car_id: string;
  created_at: string;
}

export interface TimeSlot {
  time: string;
  available: boolean;
}

export interface AvailableSlotsResponse {
  date: string;
  car_id: string;
  slots: TimeSlot[];
}

export const viewingsApi = {
  getAvailableSlots: (carId: string, date: string) =>
    api.get<AvailableSlotsResponse>(`/cars/${carId}/available-slots?date=${date}`),

  book: (data: UserViewingCreate) =>
    api.post<ViewingPublic>('/user/viewings', data),

  list: () =>
    api.get<{ data: ViewingPublic[]; count: number }>('/user/viewings'),

  cancel: (viewingId: string) =>
    api.patch<ViewingPublic>(`/user/viewings/${viewingId}/cancel`, {}),
};