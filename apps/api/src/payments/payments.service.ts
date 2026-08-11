import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { BookingStatus, PaymentStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";
import { MpesaClient } from "./mpesa.client";
import { InitiatePaymentDto } from "./dto/initiate-payment.dto";

interface MpesaCallbackBody {
  Body: {
    stkCallback: {
      MerchantRequestID: string;
      CheckoutRequestID: string;
      ResultCode: number;
      ResultDesc: string;
      CallbackMetadata?: { Item: { Name: string; Value?: string | number }[] };
    };
  };
}

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mpesa: MpesaClient,
    private readonly notifications: NotificationsService,
  ) {}

  async initiate(bookingId: string, customerId: string, dto: InitiatePaymentDto) {
    const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) {
      throw new NotFoundException("Booking not found");
    }
    if (booking.customerId !== customerId) {
      throw new ForbiddenException("Only the customer who booked can pay for this booking");
    }
    if (booking.status !== BookingStatus.accepted) {
      throw new BadRequestException("The worker must accept the booking before it can be paid for");
    }

    const stkResult = await this.mpesa.stkPush({
      phone: dto.phone,
      amount: dto.amount,
      accountReference: bookingId,
    });

    return this.prisma.payment.create({
      data: {
        bookingId,
        phone: dto.phone,
        amount: dto.amount,
        status: PaymentStatus.pending,
        merchantRequestId: stkResult.MerchantRequestID,
        checkoutRequestId: stkResult.CheckoutRequestID,
      },
    });
  }

  async findForBooking(bookingId: string, userId: string) {
    const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) {
      throw new NotFoundException("Booking not found");
    }
    if (booking.customerId !== userId && booking.workerId !== userId) {
      throw new ForbiddenException("You do not have access to this booking's payment");
    }
    return this.prisma.payment.findFirst({ where: { bookingId }, orderBy: { createdAt: "desc" } });
  }

  /** Safaricom calls this directly — no auth, must always resolve 200 with the expected ack shape. */
  async handleCallback(payload: MpesaCallbackBody) {
    const callback = payload?.Body?.stkCallback;
    if (!callback) {
      this.logger.warn(`Malformed M-Pesa callback: ${JSON.stringify(payload)}`);
      return { ResultCode: 0, ResultDesc: "Accepted" };
    }

    const payment = await this.prisma.payment.findUnique({
      where: { checkoutRequestId: callback.CheckoutRequestID },
    });
    if (!payment) {
      this.logger.warn(`No payment found for CheckoutRequestID ${callback.CheckoutRequestID}`);
      return { ResultCode: 0, ResultDesc: "Accepted" };
    }

    const success = callback.ResultCode === 0;
    const receipt = callback.CallbackMetadata?.Item.find((i) => i.Name === "MpesaReceiptNumber")?.Value;

    const updated = await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: success ? PaymentStatus.success : PaymentStatus.failed,
        mpesaReceiptNumber: receipt ? String(receipt) : undefined,
        resultDesc: callback.ResultDesc,
      },
    });

    const booking = await this.prisma.booking.findUnique({ where: { id: updated.bookingId } });
    if (booking) {
      await this.notifications.sendToUser(booking.customerId, {
        title: success ? "Payment received" : "Payment failed",
        body: success ? `KES ${updated.amount} paid successfully` : callback.ResultDesc,
      });
    }

    // Safaricom expects exactly this ack shape, regardless of what we did with the result.
    return { ResultCode: 0, ResultDesc: "Accepted" };
  }
}
