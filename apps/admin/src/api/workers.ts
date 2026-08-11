import { apiClient } from "./client";
import type { CategoryDto, WorkerProfileDto } from "@amon/shared";

export interface PendingWorker extends WorkerProfileDto {
  businessName: string | null;
  user: { id: string; name: string; email: string | null; phone: string | null };
  category: CategoryDto;
}

export interface KycUrls {
  idPhotoUrl: string | null;
  selfieUrl: string | null;
}

export function fetchPendingWorkers() {
  return apiClient.get<PendingWorker[]>("/workers/pending-review");
}

export function fetchKycUrls(userId: string) {
  return apiClient.get<KycUrls>(`/workers/${userId}/kyc-urls`);
}

export function reviewWorker(userId: string, decision: "approved" | "rejected") {
  return apiClient.patch<PendingWorker>(`/workers/${userId}/review`, { decision });
}
