import { Injectable, Logger } from "@nestjs/common";
import { Expo, ExpoPushMessage } from "expo-server-sdk";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly expo = new Expo();

  constructor(private readonly prisma: PrismaService) {}

  async registerToken(userId: string, token: string) {
    if (!Expo.isExpoPushToken(token)) {
      throw new Error("Invalid Expo push token");
    }
    await this.prisma.user.update({ where: { id: userId }, data: { expoPushToken: token } });
  }

  /** Best-effort — a failed push should never fail the request that triggered it. */
  async sendToUser(userId: string, message: { title: string; body: string; data?: Record<string, unknown> }) {
    try {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user?.expoPushToken || !Expo.isExpoPushToken(user.expoPushToken)) {
        return;
      }

      const ticket: ExpoPushMessage = {
        to: user.expoPushToken,
        sound: "default",
        title: message.title,
        body: message.body,
        data: message.data,
      };
      await this.expo.sendPushNotificationsAsync([ticket]);
    } catch (err) {
      this.logger.warn(`Failed to send push notification to user ${userId}: ${err}`);
    }
  }
}
