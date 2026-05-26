import { api } from './client';

export interface ViewingWindow {
  id: string;
  listing_id: string;
  window_date: string;
  time_from: string;
  time_to: string;
  is_available: boolean;
  created_at: string;
}

// Transaction represents an active deal / viewing session
export interface ViewingPublic {
  id: string;
  listing_id: string;
  car_id: string;       // alias for listing_id (backward compat)
  buyer_id: string;
  seller_id: string;
  status: string;
  total_amount: number;
  created_at: string;
  // Viewing-specific (may be null if not yet booked)
  viewing_date: string | null;
  viewing_time: string | null;
  comment: string | null;
  result: string;       // maps from transaction status
}

function mapTransaction(tx: Record<string, unknown>): ViewingPublic {
  const status = (tx.status as string) ?? 'reserved';
  return {
    id: tx.id as string,
    listing_id: tx.listing_id as string,
    car_id: tx.listing_id as string,
    buyer_id: tx.buyer_id as string,
    seller_id: tx.seller_id as string,
    status,
    total_amount: (tx.total_amount as number) ?? 0,
    created_at: tx.created_at as string,
    viewing_date: null,
    viewing_time: null,
    comment: null,
    result: status,
  };
}

export const viewingsApi = {
  // Get viewing windows for a listing
  getAvailableSlots: (listingId: string) =>
    api.get<ViewingWindow[]>(`/listings/${listingId}/viewing-windows`),

  // Create a transaction to reserve a listing (simplified viewing book)
  book: (data: { car_id: string; viewing_date?: string; viewing_time?: string; comment?: string }) =>
    api.post<Record<string, unknown>>('/transactions', {
      listing_id: data.car_id,
      ...(data.viewing_date && { viewing_date: data.viewing_date }),
      ...(data.viewing_time && { viewing_time: data.viewing_time }),
      ...(data.comment && { comment: data.comment }),
    }).then(mapTransaction),

  // List user's transactions as viewings
  list: () =>
    api.get<Record<string, unknown>[]>('/transactions/my')
      .then(txs => ({ data: txs.map(mapTransaction), count: txs.length })),

  // Cancel a transaction
  cancel: (transactionId: string) =>
    api.post<{ status: string }>(`/transactions/${transactionId}/cancel`, {}),
};
