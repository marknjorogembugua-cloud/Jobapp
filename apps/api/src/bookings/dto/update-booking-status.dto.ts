import { IsIn } from "class-validator";

export class UpdateBookingStatusDto {
  @IsIn(["accepted", "declined", "cancelled"])
  status!: "accepted" | "declined" | "cancelled";
}
