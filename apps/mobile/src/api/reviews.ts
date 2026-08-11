import { apiClient } from "./client";

export interface ReviewDto {
  id: string;
  rating: number;
  text: string;
  createdAt: string;
  author: { id: string; name: string };
}

export function submitReview(bookingId: string, rating: number, text: string) {
  return apiClient.post<ReviewDto>(`/bookings/${bookingId}/review`, { rating, text: text || undefined });
}

export function fetchWorkerReviews(workerId: string) {
  return apiClient.get<ReviewDto[]>(`/workers/${workerId}/reviews`);
}
