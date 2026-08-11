import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { StorageService } from "../firebase/storage.service";
import { NotificationsService } from "../notifications/notifications.service";

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly notifications: NotificationsService,
  ) {}

  private async getOwnedBooking(bookingId: string, userId: string) {
    const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) {
      throw new NotFoundException("Booking not found");
    }
    if (booking.customerId !== userId && booking.workerId !== userId) {
      throw new ForbiddenException("You do not have access to this booking's chat");
    }
    return booking;
  }

  async findMessages(bookingId: string, userId: string) {
    await this.getOwnedBooking(bookingId, userId);
    return this.prisma.message.findMany({
      where: { bookingId },
      include: { sender: { select: { id: true, name: true } } },
      orderBy: { createdAt: "asc" },
    });
  }

  async sendText(bookingId: string, userId: string, body: string) {
    const booking = await this.getOwnedBooking(bookingId, userId);
    const message = await this.prisma.message.create({
      data: { bookingId, senderId: userId, type: "text", body },
      include: { sender: { select: { id: true, name: true } } },
    });
    await this.notifyOtherParticipant(booking, userId, message.sender.name, "Sent you a message");
    return message;
  }

  async sendImage(bookingId: string, userId: string, file: Express.Multer.File) {
    const booking = await this.getOwnedBooking(bookingId, userId);
    // Chat photos are booking context (a leaking pipe, a finished job), not
    // identity documents — a public Storage URL is an acceptable trade-off
    // here, unlike the private KYC docs in WorkersService.
    const url = await this.storage.savePublic(`chat/${bookingId}`, file);
    const message = await this.prisma.message.create({
      data: { bookingId, senderId: userId, type: "image", body: url },
      include: { sender: { select: { id: true, name: true } } },
    });
    await this.notifyOtherParticipant(booking, userId, message.sender.name, "Sent you a photo");
    return message;
  }

  private async notifyOtherParticipant(
    booking: { customerId: string; workerId: string },
    senderId: string,
    senderName: string,
    body: string,
  ) {
    const recipientId = booking.customerId === senderId ? booking.workerId : booking.customerId;
    await this.notifications.sendToUser(recipientId, { title: senderName, body });
  }
}
