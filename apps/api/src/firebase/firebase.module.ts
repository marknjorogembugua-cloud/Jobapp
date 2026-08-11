import { Global, Module } from "@nestjs/common";
import { FirebaseAdminProvider } from "./firebase-admin.provider";
import { StorageService } from "./storage.service";

@Global()
@Module({
  providers: [FirebaseAdminProvider, StorageService],
  exports: [FirebaseAdminProvider, StorageService],
})
export class FirebaseModule {}
