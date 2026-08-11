export type UserRole = "customer" | "worker" | "admin";

export type WorkerStatus = "pending_review" | "approved" | "rejected" | "suspended";

export type BookingStatus =
  | "pending"
  | "accepted"
  | "declined"
  | "completed"
  | "cancelled";

export interface UserDto {
  id: string;
  role: UserRole;
  phone: string | null;
  email: string | null;
  name: string;
  createdAt: string;
}

export interface WorkerProfileDto {
  userId: string;
  categoryId: string;
  bio: string;
  skills: string[];
  yearsExperience: number;
  county: string;
  town: string;
  lat: number | null;
  lng: number | null;
  languages: string[];
  startingPrice: number;
  status: WorkerStatus;
  profilePhotoUrl: string | null;
  ratingAverage: number;
  ratingCount: number;
}

export interface CategoryDto {
  id: string;
  name: string;
  icon: string;
}

export interface BookingDto {
  id: string;
  customerId: string;
  workerId: string;
  categoryId: string;
  date: string;
  timeWindow: string;
  description: string;
  photos: string[];
  address: string;
  budget: number | null;
  status: BookingStatus;
}

export interface AuthSessionResponse {
  accessToken: string;
  refreshToken: string;
  user: UserDto;
}
