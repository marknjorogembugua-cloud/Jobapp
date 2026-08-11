import { apiClient } from "./client";
import type { BookingDto, CategoryDto } from "@amon/shared";

export interface BookingListItem extends BookingDto {
  category: CategoryDto;
  worker: { userId: string; user: { name: string } };
  customer: { id: string; name: string };
}

export interface PaymentSummary {
  id: string;
  status: "pending" | "success" | "failed";
  amount: number;
  mpesaReceiptNumber: string | null;
}

export interface BookingDetail extends BookingListItem {
  customerConfirmedAt: string | null;
  workerConfirmedAt: string | null;
  review: { id: string; rating: number; text: string } | null;
  payments: PaymentSummary[];
}

export function fetchMyBookings() {
  return apiClient.get<BookingListItem[]>("/bookings");
}

export function fetchBooking(bookingId: string) {
  return apiClient.get<BookingDetail>(`/bookings/${bookingId}`);
}

export function createBooking(input: {
  workerId: string;
  categoryId: string;
  date: string;
  timeWindow: string;
  description: string;
  address: string;
  budget?: number;
}) {
  return apiClient.post<BookingDto>("/bookings", input);
}

export function respondToBooking(bookingId: string, status: "accepted" | "declined" | "cancelled") {
  return apiClient.patch<BookingDetail>(`/bookings/${bookingId}/status`, { status });
}

export function confirmBookingComplete(bookingId: string) {
  return apiClient.post<BookingDetail>(`/bookings/${bookingId}/complete`);
}
