import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileFieldsInterceptor } from "@nestjs/platform-express";
import { WorkersService } from "./workers.service";
import { UpsertWorkerProfileDto } from "./dto/upsert-worker-profile.dto";
import { SearchWorkersDto } from "./dto/search-workers.dto";
import { ReviewWorkerDto } from "./dto/review-worker.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { CurrentUser, RequestUser } from "../auth/decorators/current-user.decorator";

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function imageFileFilter(_req: unknown, file: Express.Multer.File, callback: (error: Error | null, accept: boolean) => void) {
  if (!ALLOWED_IMAGE_TYPES.has(file.mimetype)) {
    callback(new BadRequestException("Only JPEG, PNG, or WebP images are allowed"), false);
    return;
  }
  callback(null, true);
}

@Controller("workers")
export class WorkersController {
  constructor(private readonly workersService: WorkersService) {}

  @Get()
  search(@Query() dto: SearchWorkersDto) {
    return this.workersService.search(dto);
  }

  @Get("pending-review")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  findPendingReview() {
    return this.workersService.findPendingReview();
  }

  @Get(":userId/kyc-urls")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  getKycUrls(@Param("userId") userId: string) {
    return this.workersService.getKycUrls(userId);
  }

  @Get("me/profile")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("worker")
  findOwnProfile(@CurrentUser() user: RequestUser) {
    return this.workersService.findOwnProfile(user.userId);
  }

  @Get(":userId")
  findOne(@Param("userId") userId: string) {
    return this.workersService.findByUserId(userId);
  }

  @Post("me/profile")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("worker")
  upsertOwnProfile(@CurrentUser() user: RequestUser, @Body() dto: UpsertWorkerProfileDto) {
    return this.workersService.upsertProfile(user.userId, dto);
  }

  @Post("me/uploads")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("worker")
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: "idPhoto", maxCount: 1 },
        { name: "selfie", maxCount: 1 },
        { name: "profilePhoto", maxCount: 1 },
      ],
      { limits: { fileSize: MAX_UPLOAD_BYTES }, fileFilter: imageFileFilter },
    ),
  )
  uploadDocuments(
    @CurrentUser() user: RequestUser,
    @UploadedFiles()
    files: {
      idPhoto?: Express.Multer.File[];
      selfie?: Express.Multer.File[];
      profilePhoto?: Express.Multer.File[];
    },
  ) {
    return this.workersService.uploadDocuments(user.userId, files);
  }

  @Patch(":userId/review")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  review(@Param("userId") userId: string, @Body() dto: ReviewWorkerDto) {
    return this.workersService.review(userId, dto.decision);
  }
}
