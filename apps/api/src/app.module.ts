import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "./app.controller";
import { PrismaModule } from "./prisma/prisma.module";
import { FirebaseModule } from "./firebase/firebase.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { CategoriesModule } from "./categories/categories.module";
import { WorkersModule } from "./workers/workers.module";
import { BookingsModule } from "./bookings/bookings.module";
import { ChatModule } from "./chat/chat.module";
import { ReviewsModule } from "./reviews/reviews.module";
import { PaymentsModule } from "./payments/payments.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    FirebaseModule,
    NotificationsModule,
    AuthModule,
    UsersModule,
    CategoriesModule,
    WorkersModule,
    BookingsModule,
    ChatModule,
    ReviewsModule,
    PaymentsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
