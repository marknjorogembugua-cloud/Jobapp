import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ChatService } from "./chat.service";
import { CreateMessageDto } from "./dto/create-message.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser, RequestUser } from "../auth/decorators/current-user.decorator";

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

@Controller("bookings/:bookingId/messages")
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get()
  findMessages(@Param("bookingId") bookingId: string, @CurrentUser() user: RequestUser) {
    return this.chatService.findMessages(bookingId, user.userId);
  }

  @Post()
  sendText(
    @Param("bookingId") bookingId: string,
    @CurrentUser() user: RequestUser,
    @Body() dto: CreateMessageDto,
  ) {
    return this.chatService.sendText(bookingId, user.userId, dto.body);
  }

  @Post("image")
  @UseInterceptors(
    FileInterceptor("image", {
      limits: { fileSize: MAX_UPLOAD_BYTES },
      fileFilter: (_req, file, callback) => {
        if (!ALLOWED_IMAGE_TYPES.has(file.mimetype)) {
          callback(new BadRequestException("Only JPEG, PNG, or WebP images are allowed"), false);
          return;
        }
        callback(null, true);
      },
    }),
  )
  sendImage(
    @Param("bookingId") bookingId: string,
    @CurrentUser() user: RequestUser,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException("An image file is required");
    }
    return this.chatService.sendImage(bookingId, user.userId, file);
  }
}
