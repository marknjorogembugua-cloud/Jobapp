import { useState } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import type { UserDto } from "@amon/shared";
import { registerForPushNotifications } from "./src/notifications/registerPushToken";
import { HomeScreen } from "./src/screens/HomeScreen";
import { LoginScreen } from "./src/screens/LoginScreen";
import { WorkerOnboardingScreen } from "./src/screens/WorkerOnboardingScreen";
import { WorkerProfileScreen } from "./src/screens/WorkerProfileScreen";
import { BookingRequestScreen } from "./src/screens/BookingRequestScreen";
import { BookingsListScreen } from "./src/screens/BookingsListScreen";
import { BookingDetailScreen } from "./src/screens/BookingDetailScreen";
import { ChatScreen } from "./src/screens/ChatScreen";
import { ReviewScreen } from "./src/screens/ReviewScreen";
import { PaymentScreen } from "./src/screens/PaymentScreen";

type Route =
  | { name: "home" }
  | { name: "workerOnboarding" }
  | { name: "workerProfile"; workerId: string }
  | { name: "bookingRequest"; workerId: string; categoryId: string }
  | { name: "bookings" }
  | { name: "bookingDetail"; bookingId: string }
  | { name: "chat"; bookingId: string }
  | { name: "review"; bookingId: string }
  | { name: "payment"; bookingId: string; suggestedAmount: number };

export default function App() {
  const [user, setUser] = useState<UserDto | null>(null);
  const [route, setRoute] = useState<Route>({ name: "home" });

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      {!user ? (
        <LoginScreen
          onLoggedIn={(loggedInUser) => {
            setUser(loggedInUser);
            setRoute(loggedInUser.role === "worker" ? { name: "workerOnboarding" } : { name: "home" });
            registerForPushNotifications();
          }}
        />
      ) : route.name === "home" ? (
        <HomeScreen
          onSelectWorker={(workerId) => setRoute({ name: "workerProfile", workerId })}
          onManageWorkerProfile={user.role === "worker" ? () => setRoute({ name: "workerOnboarding" }) : undefined}
          onOpenBookings={() => setRoute({ name: "bookings" })}
        />
      ) : route.name === "workerOnboarding" ? (
        <WorkerOnboardingScreen onBack={() => setRoute({ name: "home" })} />
      ) : route.name === "workerProfile" ? (
        <WorkerProfileScreen
          workerId={route.workerId}
          onBack={() => setRoute({ name: "home" })}
          onBook={() => setRoute({ name: "bookingRequest", workerId: route.workerId, categoryId: "" })}
        />
      ) : route.name === "bookingRequest" ? (
        <BookingRequestScreen
          workerId={route.workerId}
          categoryId={route.categoryId}
          onBack={() => setRoute({ name: "workerProfile", workerId: route.workerId })}
          onSubmitted={() => setRoute({ name: "bookings" })}
        />
      ) : route.name === "bookings" ? (
        <BookingsListScreen
          role={user.role}
          onBack={() => setRoute({ name: "home" })}
          onSelectBooking={(bookingId) => setRoute({ name: "bookingDetail", bookingId })}
        />
      ) : route.name === "bookingDetail" ? (
        <BookingDetailScreen
          bookingId={route.bookingId}
          role={user.role}
          onBack={() => setRoute({ name: "bookings" })}
          onOpenChat={(bookingId) => setRoute({ name: "chat", bookingId })}
          onPay={(bookingId, suggestedAmount) => setRoute({ name: "payment", bookingId, suggestedAmount })}
          onReview={(bookingId) => setRoute({ name: "review", bookingId })}
        />
      ) : route.name === "chat" ? (
        <ChatScreen
          bookingId={route.bookingId}
          currentUserId={user.id}
          onBack={() => setRoute({ name: "bookingDetail", bookingId: route.bookingId })}
        />
      ) : route.name === "review" ? (
        <ReviewScreen
          bookingId={route.bookingId}
          onBack={() => setRoute({ name: "bookingDetail", bookingId: route.bookingId })}
          onSubmitted={() => setRoute({ name: "bookingDetail", bookingId: route.bookingId })}
        />
      ) : route.name === "payment" ? (
        <PaymentScreen
          bookingId={route.bookingId}
          suggestedAmount={route.suggestedAmount}
          onBack={() => setRoute({ name: "bookingDetail", bookingId: route.bookingId })}
          onDone={() => setRoute({ name: "bookingDetail", bookingId: route.bookingId })}
        />
      ) : null}
    </SafeAreaProvider>
  );
}
