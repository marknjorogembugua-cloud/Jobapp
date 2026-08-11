import { IsIn, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateSessionDto {
  @IsString()
  @IsNotEmpty()
  firebaseIdToken!: string;

  @IsOptional()
  @IsIn(["customer", "worker"])
  role?: "customer" | "worker";

  @IsOptional()
  @IsString()
  name?: string;
}
