import { Provider } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as admin from "firebase-admin";

export const FIREBASE_ADMIN = "FIREBASE_ADMIN";

export const FirebaseAdminProvider: Provider = {
  provide: FIREBASE_ADMIN,
  inject: [ConfigService],
  useFactory: (config: ConfigService) => {
    if (admin.apps.length > 0) {
      return admin.app();
    }
    const projectId = config.get<string>("FIREBASE_PROJECT_ID");
    const clientEmail = config.get<string>("FIREBASE_CLIENT_EMAIL");
    const privateKey = config.get<string>("FIREBASE_PRIVATE_KEY")?.replace(/\\n/g, "\n");
    const storageBucket = config.get<string>("FIREBASE_STORAGE_BUCKET");

    return admin.initializeApp({
      credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
      storageBucket,
    });
  },
};
