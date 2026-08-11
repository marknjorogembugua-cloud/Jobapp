import { Inject, Injectable } from "@nestjs/common";
import * as admin from "firebase-admin";
import { randomUUID } from "crypto";
import { FIREBASE_ADMIN } from "./firebase-admin.provider";

@Injectable()
export class StorageService {
  constructor(@Inject(FIREBASE_ADMIN) private readonly firebaseApp: admin.app.App) {}

  private bucket() {
    return this.firebaseApp.storage().bucket();
  }

  /**
   * Stores a file privately and returns the storage path (not a URL) — callers
   * must go through a signed-URL step to actually view it. Used for KYC docs
   * (ID photo, selfie) that must never be reachable by a public/guessable URL.
   */
  async savePrivate(path: string, file: Express.Multer.File): Promise<string> {
    const objectPath = `${path}/${randomUUID()}-${file.originalname}`;
    await this.bucket().file(objectPath).save(file.buffer, {
      contentType: file.mimetype,
      resumable: false,
    });
    return objectPath;
  }

  /** Stores a file and returns a permanent public URL — for content meant to be publicly visible. */
  async savePublic(path: string, file: Express.Multer.File): Promise<string> {
    const objectPath = `${path}/${randomUUID()}-${file.originalname}`;
    const blob = this.bucket().file(objectPath);
    await blob.save(file.buffer, { contentType: file.mimetype, resumable: false });
    await blob.makePublic();
    return `https://storage.googleapis.com/${this.bucket().name}/${objectPath}`;
  }

  async getSignedUrl(path: string, expiresInMs = 15 * 60 * 1000): Promise<string> {
    const [url] = await this.bucket()
      .file(path)
      .getSignedUrl({ action: "read", expires: Date.now() + expiresInMs });
    return url;
  }
}
