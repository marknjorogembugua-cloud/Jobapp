import { apiClient } from "./client";

export interface ChatMessage {
  id: string;
  bookingId: string;
  senderId: string;
  sender: { id: string; name: string };
  type: "text" | "image";
  body: string;
  createdAt: string;
}

export function fetchMessages(bookingId: string) {
  return apiClient.get<ChatMessage[]>(`/bookings/${bookingId}/messages`);
}

export function sendTextMessage(bookingId: string, body: string) {
  return apiClient.post<ChatMessage>(`/bookings/${bookingId}/messages`, { body });
}

export function sendImageMessage(bookingId: string, uri: string) {
  const form = new FormData();
  const filename = uri.split("/").pop() ?? "photo.jpg";
  const extension = filename.split(".").pop()?.toLowerCase();
  const mimeType = extension === "png" ? "image/png" : extension === "webp" ? "image/webp" : "image/jpeg";
  // React Native's fetch/FormData accepts this { uri, name, type } shape in place of a Blob.
  form.append("image", { uri, name: filename, type: mimeType } as unknown as Blob);
  return apiClient.postForm<ChatMessage>(`/bookings/${bookingId}/messages/image`, form);
}
