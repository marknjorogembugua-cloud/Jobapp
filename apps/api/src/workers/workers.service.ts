import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { WorkerStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { StorageService } from "../firebase/storage.service";
import { NotificationsService } from "../notifications/notifications.service";
import { UpsertWorkerProfileDto } from "./dto/upsert-worker-profile.dto";
import { SearchWorkersDto } from "./dto/search-workers.dto";

// ID photo and selfie are KYC documents — never select them for routes a
// customer or unauthenticated caller can hit (search, findOne). Only the
// owning worker (findOwnProfile) and admin review routes may see them, and
// even those only get upload-status booleans / signed URLs, never a bare
// public path.
const PUBLIC_PROFILE_SELECT = {
  userId: true,
  categoryId: true,
  category: true,
  user: { select: { id: true, name: true, phone: true } },
  businessName: true,
  bio: true,
  skills: true,
  yearsExperience: true,
  county: true,
  town: true,
  lat: true,
  lng: true,
  languages: true,
  startingPrice: true,
  workingHours: true,
  status: true,
  profilePhotoUrl: true,
  ratingAverage: true,
  ratingCount: true,
  createdAt: true,
} as const;

@Injectable()
export class WorkersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly notifications: NotificationsService,
  ) {}

  async upsertProfile(userId: string, dto: UpsertWorkerProfileDto) {
    const existing = await this.prisma.workerProfile.findUnique({ where: { userId } });

    return this.prisma.workerProfile.upsert({
      where: { userId },
      create: {
        userId,
        categoryId: dto.categoryId,
        businessName: dto.businessName,
        bio: dto.bio ?? "",
        skills: dto.skills ?? [],
        yearsExperience: dto.yearsExperience ?? 0,
        county: dto.county,
        town: dto.town,
        lat: dto.lat,
        lng: dto.lng,
        languages: dto.languages ?? [],
        startingPrice: dto.startingPrice,
        workingHours: dto.workingHours ?? "",
      },
      update: {
        categoryId: dto.categoryId,
        businessName: dto.businessName,
        bio: dto.bio,
        skills: dto.skills,
        yearsExperience: dto.yearsExperience,
        county: dto.county,
        town: dto.town,
        lat: dto.lat,
        lng: dto.lng,
        languages: dto.languages,
        startingPrice: dto.startingPrice,
        workingHours: dto.workingHours,
        // Editing an approved profile sends it back for re-review.
        status: existing?.status === "approved" ? WorkerStatus.pending_review : existing?.status,
      },
    });
  }

  private async setUploads(userId: string, uploads: { idPhotoUrl?: string; selfieUrl?: string; profilePhotoUrl?: string }) {
    return this.prisma.workerProfile.update({
      where: { userId },
      data: uploads,
    });
  }

  /**
   * Accepts KYC documents (ID photo, selfie) and/or a profile photo for the
   * authenticated worker. ID/selfie are stored in a private Storage path —
   * only their upload status is ever returned, never a URL — while the
   * profile photo is public since it's shown on the worker's public listing.
   */
  async uploadDocuments(
    userId: string,
    files: {
      idPhoto?: Express.Multer.File[];
      selfie?: Express.Multer.File[];
      profilePhoto?: Express.Multer.File[];
    },
  ) {
    const profile = await this.prisma.workerProfile.findUnique({ where: { userId } });
    if (!profile) {
      throw new NotFoundException("Create your worker profile before uploading documents");
    }

    const updates: { idPhotoUrl?: string; selfieUrl?: string; profilePhotoUrl?: string } = {};

    if (files.idPhoto?.[0]) {
      updates.idPhotoUrl = await this.storage.savePrivate(`worker-kyc/${userId}/id`, files.idPhoto[0]);
    }
    if (files.selfie?.[0]) {
      updates.selfieUrl = await this.storage.savePrivate(`worker-kyc/${userId}/selfie`, files.selfie[0]);
    }
    if (files.profilePhoto?.[0]) {
      updates.profilePhotoUrl = await this.storage.savePublic(`worker-photos/${userId}`, files.profilePhoto[0]);
    }

    if (Object.keys(updates).length === 0) {
      throw new BadRequestException("No files provided");
    }

    await this.setUploads(userId, updates);
    return this.findOwnProfile(userId);
  }

  findByUserId(userId: string) {
    return this.prisma.workerProfile.findUnique({
      where: { userId },
      select: PUBLIC_PROFILE_SELECT,
    });
  }

  /** Full profile for the owning worker, with KYC fields collapsed to booleans instead of paths. */
  async findOwnProfile(userId: string) {
    const profile = await this.prisma.workerProfile.findUnique({
      where: { userId },
      include: { category: true },
    });
    if (!profile) return null;

    const { idPhotoUrl, selfieUrl, ...rest } = profile;
    return {
      ...rest,
      idPhotoUploaded: Boolean(idPhotoUrl),
      selfieUploaded: Boolean(selfieUrl),
    };
  }

  async search(dto: SearchWorkersDto) {
    const where = {
      status: WorkerStatus.approved,
      ...(dto.categoryId ? { categoryId: dto.categoryId } : {}),
      ...(dto.county ? { county: dto.county } : {}),
      ...(dto.town ? { town: dto.town } : {}),
      ...(dto.query
        ? { OR: [{ bio: { contains: dto.query, mode: "insensitive" as const } }, { businessName: { contains: dto.query, mode: "insensitive" as const } }] }
        : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.workerProfile.findMany({
        where,
        select: PUBLIC_PROFILE_SELECT,
        skip: (dto.page - 1) * dto.pageSize,
        take: dto.pageSize,
        orderBy: { ratingAverage: "desc" },
      }),
      this.prisma.workerProfile.count({ where }),
    ]);

    return { data, total, page: dto.page, pageSize: dto.pageSize };
  }

  findPendingReview() {
    return this.prisma.workerProfile.findMany({
      where: { status: WorkerStatus.pending_review },
      include: { user: true, category: true },
      orderBy: { createdAt: "asc" },
    });
  }

  /** Admin-only: mints short-lived signed URLs so a reviewer can actually view the private KYC uploads. */
  async getKycUrls(userId: string) {
    const profile = await this.prisma.workerProfile.findUnique({
      where: { userId },
      select: { idPhotoUrl: true, selfieUrl: true },
    });
    if (!profile) {
      throw new NotFoundException("Worker profile not found");
    }
    const [idPhotoUrl, selfieUrl] = await Promise.all([
      profile.idPhotoUrl ? this.storage.getSignedUrl(profile.idPhotoUrl) : null,
      profile.selfieUrl ? this.storage.getSignedUrl(profile.selfieUrl) : null,
    ]);
    return { idPhotoUrl, selfieUrl };
  }

  async review(userId: string, decision: "approved" | "rejected") {
    const profile = await this.prisma.workerProfile.findUnique({ where: { userId } });
    if (!profile) {
      throw new NotFoundException("Worker profile not found");
    }
    if (profile.status !== WorkerStatus.pending_review) {
      throw new ForbiddenException("Only profiles pending review can be approved or rejected");
    }
    const updated = await this.prisma.workerProfile.update({
      where: { userId },
      data: { status: decision },
    });
    await this.notifications.sendToUser(userId, {
      title: decision === "approved" ? "You're approved!" : "Profile needs changes",
      body:
        decision === "approved"
          ? "Your worker profile is live — customers can now find and book you."
          : "Your worker profile was not approved. Edit it and resubmit for review.",
    });
    return updated;
  }
}
