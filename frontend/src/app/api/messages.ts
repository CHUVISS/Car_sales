import { api } from './client';

export type MessageType = 'inquiry' | 'callback' | 'general';

export interface MessageCreate {
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  body: string;
  message_type?: MessageType;
  car_id?: string;
}

export interface MessagePublic {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  body: string;
  message_type: MessageType;
  status: string;
  car_id: string | null;
  created_at: string;
}

export const messagesApi = {
  send: (data: MessageCreate) =>
    api.post<MessagePublic>('/messages', data),
};