import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { UserRole } from "@amon/shared";
import { confirmBookingComplete, fetchBooking, respondToBooking, type BookingDetail } from "../api/bookings";
import { colors, spacing } from "../theme";

type Props = {
  bookingId: string;
  role: UserRole;
  onBack: () => void;
  onOpenChat: (bookingId: string) => void;
  onPay: (bookingId: string, suggestedAmount: number) => void;
  onReview: (bookingId: string) => void;
};

export function BookingDetailScreen({ bookingId, role, onBack, onOpenChat, onPay, onReview }: Props) {
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    return fetchBooking(bookingId)
      .then(setBooking)
      .catch(() => setError("Could not load this booking"));
  }, [bookingId]);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  async function handleRespond(status: "accepted" | "declined" | "cancelled") {
    setError(null);
    setActing(true);
    try {
      const updated = await respondToBooking(bookingId, status);
      setBooking((prev) => (prev ? { ...prev, ...updated } : prev));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update the booking");
    } finally {
      setActing(false);
    }
  }

  async function handleConfirmComplete() {
    setError(null);
    setActing(true);
    try {
      const updated = await confirmBookingComplete(bookingId);
      setBooking((prev) => (prev ? { ...prev, ...updated } : prev));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not confirm completion");
    } finally {
      setActing(false);
    }
  }

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator color={colors.copper} />
      </View>
    );
  }

  if (!booking) {
    return (
      <View style={styles.container}>
        <Text style={styles.back} onPress={onBack}>← Back</Text>
        <Text style={styles.error}>{error ?? "Booking not found"}</Text>
      </View>
    );
  }

  const otherPartyName = role === "worker" ? booking.customer.name : booking.worker.user.name;
  const iHaveConfirmed = role === "worker" ? Boolean(booking.workerConfirmedAt) : Boolean(booking.customerConfirmedAt);
  const latestPayment = booking.payments[0];

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: spacing.xl }}>
      <Text style={styles.back} onPress={onBack}>← Back</Text>
      <Text style={styles.title}>{booking.category.name}</Text>
      <Text style={styles.subtitle}>with {otherPartyName}</Text>

      <View style={styles.section}>
        <Text style={styles.label}>Status</Text>
        <Text style={styles.value}>{booking.status}</Text>

        <Text style={styles.label}>When</Text>
        <Text style={styles.value}>{new Date(booking.date).toDateString()} · {booking.timeWindow}</Text>

        <Text style={styles.label}>Details</Text>
        <Text style={styles.value}>{booking.description}</Text>

        <Text style={styles.label}>Address</Text>
        <Text style={styles.value}>{booking.address}</Text>

        {booking.budget != null && (
          <>
            <Text style={styles.label}>Budget</Text>
            <Text style={styles.value}>KES {booking.budget}</Text>
          </>
        )}
      </View>

      {latestPayment && (
        <View style={styles.section}>
          <Text style={styles.label}>Payment</Text>
          <Text style={styles.value}>
            KES {latestPayment.amount} · {latestPayment.status}
            {latestPayment.mpesaReceiptNumber ? ` · ${latestPayment.mpesaReceiptNumber}` : ""}
          </Text>
        </View>
      )}

      {error && <Text style={styles.error}>{error}</Text>}

      <View style={styles.actions}>
        {role === "worker" && booking.status === "pending" && (
          <>
            <Pressable style={styles.button} onPress={() => handleRespond("accepted")} disabled={acting}>
              <Text style={styles.buttonText}>Accept</Text>
            </Pressable>
            <Pressable style={[styles.button, styles.secondaryButton]} onPress={() => handleRespond("declined")} disabled={acting}>
              <Text style={styles.secondaryButtonText}>Decline</Text>
            </Pressable>
          </>
        )}

        {role === "customer" && booking.status === "pending" && (
          <Pressable style={[styles.button, styles.secondaryButton]} onPress={() => handleRespond("cancelled")} disabled={acting}>
            <Text style={styles.secondaryButtonText}>Cancel request</Text>
          </Pressable>
        )}

        {booking.status === "accepted" && (
          <>
            <Pressable style={styles.button} onPress={() => onOpenChat(booking.id)}>
              <Text style={styles.buttonText}>Chat</Text>
            </Pressable>
            {role === "customer" && !latestPayment && booking.budget != null && (
              <Pressable style={styles.button} onPress={() => onPay(booking.id, booking.budget ?? 0)}>
                <Text style={styles.buttonText}>Pay with M-Pesa</Text>
              </Pressable>
            )}
            {!iHaveConfirmed && (
              <Pressable style={[styles.button, styles.secondaryButton]} onPress={handleConfirmComplete} disabled={acting}>
                <Text style={styles.secondaryButtonText}>Mark as done</Text>
              </Pressable>
            )}
          </>
        )}

        {booking.status !== "pending" && booking.status !== "cancelled" && (
          <Pressable style={[styles.button, styles.secondaryButton]} onPress={() => onOpenChat(booking.id)}>
            <Text style={styles.secondaryButtonText}>Chat</Text>
          </Pressable>
        )}

        {role === "customer" && booking.status === "completed" && !booking.review && (
          <Pressable style={styles.button} onPress={() => onReview(booking.id)}>
            <Text style={styles.buttonText}>Leave a review</Text>
          </Pressable>
        )}

        {booking.review && (
          <View style={styles.section}>
            <Text style={styles.label}>Your review</Text>
            <Text style={styles.value}>{"★".repeat(booking.review.rating)} {booking.review.text}</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper, paddingTop: 56, paddingHorizontal: spacing.md },
  centered: { justifyContent: "center", alignItems: "center" },
  back: { color: colors.copper, fontWeight: "600", marginBottom: spacing.md },
  title: { fontSize: 22, fontWeight: "700", color: colors.ink },
  subtitle: { color: colors.muted, marginBottom: spacing.md },
  section: { backgroundColor: "#fff", borderRadius: 12, padding: spacing.md, marginTop: spacing.md },
  label: { color: colors.muted, fontSize: 12, marginTop: spacing.sm },
  value: { color: colors.ink, fontSize: 15, marginTop: 2 },
  actions: { gap: spacing.sm, marginTop: spacing.lg },
  button: { backgroundColor: colors.copper, borderRadius: 10, paddingVertical: 14, alignItems: "center" },
  buttonText: { color: colors.paper, fontWeight: "700" },
  secondaryButton: { backgroundColor: "#00000010" },
  secondaryButtonText: { color: colors.ink, fontWeight: "700" },
  error: { color: "#E4756B", marginTop: spacing.sm },
});
