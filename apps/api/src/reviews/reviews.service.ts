import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { BookingStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";
import { CreateReviewDto } from "./dto/create-review.dto";

@Injectable()
export class ReviewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async create(bookingId: string, customerId: string, dto: CreateReviewDto) {
    const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) {
      throw new NotFoundException("Booking not found");
    }
    if (booking.customerId !== customerId) {
      throw new ForbiddenException("Only the customer who booked can leave a review");
    }
    if (booking.status !== BookingStatus.completed) {
      throw new BadRequestException("Only a completed booking can be reviewed");
    }

    const existing = await this.prisma.review.findUnique({ where: { bookingId } });
    if (existing) {
      throw new BadRequestException("This booking has already been reviewed");
    }

    const review = await this.prisma.review.create({
      data: { bookingId, authorId: customerId, rating: dto.rating, text: dto.text ?? "" },
      include: { author: { select: { id: true, name: true } } },
    });

    await this.recomputeWorkerRating(booking.workerId);
    await this.notifications.sendToUser(booking.workerId, {
      title: "New review",
      body: `${review.author.name} left you a ${dto.rating}-star review`,
    });

    return review;
  }

  findForWorker(workerId: string) {
    return this.prisma.review.findMany({
      where: { booking: { workerId } },
      include: { author: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    });
  }

  private async recomputeWorkerRating(workerId: string) {
    const stats = await this.prisma.review.aggregate({
      where: { booking: { workerId } },
      _avg: { rating: true },
      _count: true,
    });

    await this.prisma.workerProfile.update({
      where: { userId: workerId },
      data: {
        ratingAverage: stats._avg.rating ?? 0,
        ratingCount: stats._count,
      },
    });
  }
}
