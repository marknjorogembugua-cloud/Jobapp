import { IsIn } from "class-validator";

export class ReviewWorkerDto {
  @IsIn(["approved", "rejected"])
  decision!: "approved" | "rejected";
}
