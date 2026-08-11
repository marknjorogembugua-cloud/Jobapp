import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { ReviewsService } from "./reviews.service";
import { CreateReviewDto } from "./dto/create-review.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { CurrentUser, RequestUser } from "../auth/decorators/current-user.decorator";

@Controller()
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post("bookings/:bookingId/review")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("customer")
  create(
    @Param("bookingId") bookingId: string,
    @CurrentUser() user: RequestUser,
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviewsService.create(bookingId, user.userId, dto);
  }

  @Get("workers/:workerId/reviews")
  findForWorker(@Param("workerId") workerId: string) {
    return this.reviewsService.findForWorker(workerId);
  }
}
