import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { BookingsService } from "./bookings.service";
import { CreateBookingDto } from "./dto/create-booking.dto";
import { UpdateBookingStatusDto } from "./dto/update-booking-status.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { CurrentUser, RequestUser } from "../auth/decorators/current-user.decorator";

@Controller("bookings")
@UseGuards(JwtAuthGuard, RolesGuard)
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get()
  findMine(@CurrentUser() user: RequestUser) {
    return this.bookingsService.findForUser(user);
  }

  @Get(":id")
  findOne(@Param("id") id: string, @CurrentUser() user: RequestUser) {
    return this.bookingsService.findOne(id, user);
  }

  @Post()
  @Roles("customer")
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateBookingDto) {
    return this.bookingsService.create(user.userId, dto);
  }

  @Patch(":id/status")
  updateStatus(
    @Param("id") id: string,
    @CurrentUser() user: RequestUser,
    @Body() dto: UpdateBookingStatusDto,
  ) {
    return this.bookingsService.updateStatus(id, user, dto.status);
  }

  @Post(":id/complete")
  confirmComplete(@Param("id") id: string, @CurrentUser() user: RequestUser) {
    return this.bookingsService.confirmComplete(id, user);
  }
}
