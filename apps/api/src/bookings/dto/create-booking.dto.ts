import { Type } from "class-transformer";
import { IsArray, IsISO8601, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class CreateBookingDto {
  @IsString()
  @IsNotEmpty()
  workerId!: string;

  @IsString()
  @IsNotEmpty()
  categoryId!: string;

  @IsISO8601()
  date!: string;

  @IsString()
  @IsNotEmpty()
  timeWindow!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photos?: string[];

  @IsString()
  @IsNotEmpty()
  address!: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  budget?: number;
}
