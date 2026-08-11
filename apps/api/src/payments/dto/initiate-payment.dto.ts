import { Type } from "class-transformer";
import { IsNumber, IsString, Matches, Min } from "class-validator";

export class InitiatePaymentDto {
  // Safaricom expects MSISDN format: 2547XXXXXXXX or 2541XXXXXXXX
  @IsString()
  @Matches(/^254(7|1)\d{8}$/, { message: "phone must be in the format 2547XXXXXXXX" })
  phone!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  amount!: number;
}
