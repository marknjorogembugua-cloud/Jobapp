import { Module } from "@nestjs/common";
import { PaymentsController } from "./payments.controller";
import { PaymentsService } from "./payments.service";
import { MpesaClient } from "./mpesa.client";

@Module({
  controllers: [PaymentsController],
  providers: [PaymentsService, MpesaClient],
})
export class PaymentsModule {}
