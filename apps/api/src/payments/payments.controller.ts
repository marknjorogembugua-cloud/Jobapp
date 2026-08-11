import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { PaymentsService } from "./payments.service";
import { InitiatePaymentDto } from "./dto/initiate-payment.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { CurrentUser, RequestUser } from "../auth/decorators/current-user.decorator";

@Controller()
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post("bookings/:bookingId/pay")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("customer")
  initiate(
    @Param("bookingId") bookingId: string,
    @CurrentUser() user: RequestUser,
    @Body() dto: InitiatePaymentDto,
  ) {
    return this.paymentsService.initiate(bookingId, user.userId, dto);
  }

  @Get("bookings/:bookingId/payment")
  @UseGuards(JwtAuthGuard)
  findForBooking(@Param("bookingId") bookingId: string, @CurrentUser() user: RequestUser) {
    return this.paymentsService.findForBooking(bookingId, user.userId);
  }

  // Public webhook — Safaricom calls this directly and cannot send our JWT.
  @Post("payments/mpesa/callback")
  handleCallback(@Body() payload: unknown) {
    return this.paymentsService.handleCallback(payload as Parameters<PaymentsService["handleCallback"]>[0]);
  }
}
