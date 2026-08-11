import { apiClient } from "./client";
import type { PaymentSummary } from "./bookings";

export function initiatePayment(bookingId: string, phone: string, amount: number) {
  return apiClient.post<PaymentSummary>(`/bookings/${bookingId}/pay`, { phone, amount });
}

export function fetchPayment(bookingId: string) {
  return apiClient.get<PaymentSummary | null>(`/bookings/${bookingId}/payment`);
}
