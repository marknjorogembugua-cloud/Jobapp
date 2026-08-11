import { apiClient } from "./client";
import type { CategoryDto, WorkerProfileDto } from "@amon/shared";

interface WorkerSearchResult {
  data: (WorkerProfileDto & { user: { name: string }; category: CategoryDto })[];
  total: number;
  page: number;
  pageSize: number;
}

export interface OwnWorkerProfile extends WorkerProfileDto {
  businessName: string | null;
  workingHours: string;
  category: CategoryDto;
  idPhotoUploaded: boolean;
  selfieUploaded: boolean;
}

export interface WorkerProfileInput {
  categoryId: string;
  businessName?: string;
  bio?: string;
  skills?: string[];
  yearsExperience?: number;
  county: string;
  town: string;
  languages?: string[];
  startingPrice: number;
  workingHours?: string;
}

export function fetchCategories() {
  return apiClient.get<CategoryDto[]>("/categories");
}

export function searchWorkers(params: { categoryId?: string; county?: string; query?: string }) {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => Boolean(v)) as [string, string][],
  ).toString();
  return apiClient.get<WorkerSearchResult>(`/workers${qs ? `?${qs}` : ""}`);
}

export function fetchOwnWorkerProfile() {
  return apiClient.get<OwnWorkerProfile | null>("/workers/me/profile");
}

export function upsertWorkerProfile(profile: WorkerProfileInput) {
  return apiClient.post<OwnWorkerProfile>("/workers/me/profile", profile);
}

export function uploadWorkerDocuments(files: { idPhoto?: string; selfie?: string; profilePhoto?: string }) {
  const form = new FormData();
  for (const [field, uri] of Object.entries(files)) {
    if (!uri) continue;
    const filename = uri.split("/").pop() ?? `${field}.jpg`;
    const extension = filename.split(".").pop()?.toLowerCase();
    const mimeType = extension === "png" ? "image/png" : extension === "webp" ? "image/webp" : "image/jpeg";
    // React Native's fetch/FormData accepts this { uri, name, type } shape in place of a Blob.
    form.append(field, { uri, name: filename, type: mimeType } as unknown as Blob);
  }
  return apiClient.postForm<OwnWorkerProfile>("/workers/me/uploads", form);
}
