import { BadRequestException, ForbiddenException } from "@nestjs/common";
import { BookingsService } from "./bookings.service";

function makePrismaMock(booking: any) {
  return {
    booking: {
      findUnique: jest.fn().mockResolvedValue(booking),
      update: jest.fn((args: any) => Promise.resolve({ ...booking, ...args.data })),
      create: jest.fn(),
    },
    workerProfile: { findUnique: jest.fn() },
  } as any;
}

function makeNotificationsMock() {
  return { sendToUser: jest.fn().mockResolvedValue(undefined) } as any;
}

describe("BookingsService", () => {
  it("only lets the assigned worker accept a booking", async () => {
    const booking = { id: "b1", customerId: "cust-1", workerId: "worker-1", status: "pending" };
    const prisma = makePrismaMock(booking);
    const service = new BookingsService(prisma, makeNotificationsMock());

    await expect(
      service.updateStatus("b1", { userId: "cust-1", role: "customer" }, "accepted"),
    ).rejects.toBeInstanceOf(ForbiddenException);

    const result = await service.updateStatus("b1", { userId: "worker-1", role: "worker" }, "accepted");
    expect(result.status).toBe("accepted");
  });

  it("rejects accept/decline on a booking that isn't pending", async () => {
    const booking = { id: "b1", customerId: "cust-1", workerId: "worker-1", status: "completed" };
    const prisma = makePrismaMock(booking);
    const service = new BookingsService(prisma, makeNotificationsMock());

    await expect(
      service.updateStatus("b1", { userId: "worker-1", role: "worker" }, "accepted"),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("only marks a booking completed once both parties confirm", async () => {
    const booking = {
      id: "b1",
      customerId: "cust-1",
      workerId: "worker-1",
      status: "accepted",
      customerConfirmedAt: null,
      workerConfirmedAt: null,
    };
    const prisma = makePrismaMock(booking);
    const service = new BookingsService(prisma, makeNotificationsMock());

    const afterCustomer = await service.confirmComplete("b1", { userId: "cust-1", role: "customer" });
    expect(afterCustomer.status).toBe("accepted");

    booking.customerConfirmedAt = new Date() as any;
    const afterWorker = await service.confirmComplete("b1", { userId: "worker-1", role: "worker" });
    expect(afterWorker.status).toBe("completed");
  });
});
