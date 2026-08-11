import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { BookingStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";
import { CreateBookingDto } from "./dto/create-booking.dto";

export type BookingActor = { userId: string; role: string };

@Injectable()
export class BookingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async create(customerId: string, dto: CreateBookingDto) {
    const worker = await this.prisma.workerProfile.findUnique({ where: { userId: dto.workerId } });
    if (!worker || worker.status !== "approved") {
      throw new BadRequestException("Worker is not available for booking");
    }

    const booking = await this.prisma.booking.create({
      data: {
        customerId,
        workerId: dto.workerId,
        categoryId: dto.categoryId,
        date: new Date(dto.date),
        timeWindow: dto.timeWindow,
        description: dto.description,
        photos: dto.photos ?? [],
        address: dto.address,
        budget: dto.budget,
      },
    });

    await this.notifications.sendToUser(dto.workerId, {
      title: "New booking request",
      body: `${dto.timeWindow} on ${booking.date.toDateString()}`,
      data: { bookingId: booking.id },
    });

    return booking;
  }

  findForUser(actor: BookingActor) {
    const where = actor.role === "worker" ? { workerId: actor.userId } : { customerId: actor.userId };
    return this.prisma.booking.findMany({
      where,
      include: { category: true, worker: { include: { user: true } }, customer: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async findOne(bookingId: string, actor: BookingActor) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        category: true,
        worker: { include: { user: true } },
        customer: true,
        review: true,
        payments: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    });
    if (!booking) {
      throw new NotFoundException("Booking not found");
    }
    if (booking.customerId !== actor.userId && booking.workerId !== actor.userId) {
      throw new ForbiddenException("You do not have access to this booking");
    }
    return booking;
  }

  private async getOwnedBooking(bookingId: string, actor: BookingActor) {
    const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) {
      throw new NotFoundException("Booking not found");
    }
    if (booking.customerId !== actor.userId && booking.workerId !== actor.userId) {
      throw new ForbiddenException("You do not have access to this booking");
    }
    return booking;
  }

  async updateStatus(bookingId: string, actor: BookingActor, status: "accepted" | "declined" | "cancelled") {
    const booking = await this.getOwnedBooking(bookingId, actor);

    if ((status === "accepted" || status === "declined") && booking.workerId !== actor.userId) {
      throw new ForbiddenException("Only the assigned worker can accept or decline a booking");
    }
    if ((status === "accepted" || status === "declined") && booking.status !== BookingStatus.pending) {
      throw new BadRequestException("Only a pending booking can be accepted or declined");
    }
    if (status === "cancelled" && !["pending", "accepted"].includes(booking.status)) {
      throw new BadRequestException("This booking can no longer be cancelled");
    }

    const updated = await this.prisma.booking.update({ where: { id: bookingId }, data: { status } });

    if (status === "accepted" || status === "declined") {
      await this.notifications.sendToUser(booking.customerId, {
        title: status === "accepted" ? "Booking accepted" : "Booking declined",
        body: status === "accepted" ? "The worker accepted your booking request" : "The worker declined your booking request",
        data: { bookingId: updated.id },
      });
    }

    return updated;
  }

  async confirmComplete(bookingId: string, actor: BookingActor) {
    const booking = await this.getOwnedBooking(bookingId, actor);
    if (booking.status !== BookingStatus.accepted) {
      throw new BadRequestException("Only an accepted booking can be marked complete");
    }

    const isCustomer = booking.customerId === actor.userId;
    const data = isCustomer
      ? { customerConfirmedAt: new Date() }
      : { workerConfirmedAt: new Date() };

    const updated = await this.prisma.booking.update({ where: { id: bookingId }, data });

    if (updated.customerConfirmedAt && updated.workerConfirmedAt) {
      const completed = await this.prisma.booking.update({
        where: { id: bookingId },
        data: { status: BookingStatus.completed },
      });
      await this.notifications.sendToUser(isCustomer ? booking.workerId : booking.customerId, {
        title: "Booking completed",
        body: "Both sides confirmed the job is done",
        data: { bookingId: completed.id },
      });
      return completed;
    }

    // Only one side has confirmed so far — nudge the other one.
    await this.notifications.sendToUser(isCustomer ? booking.workerId : booking.customerId, {
      title: "Confirm booking completion",
      body: isCustomer ? "The customer marked this job as done" : "The worker marked this job as done",
      data: { bookingId: updated.id },
    });
    return updated;
  }
}
