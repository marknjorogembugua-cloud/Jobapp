import { useCallback, useEffect, useState } from "react";
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import type { UserRole } from "@amon/shared";
import { fetchMyBookings, type BookingListItem } from "../api/bookings";
import { colors, spacing } from "../theme";

type Props = {
  role: UserRole;
  onBack: () => void;
  onSelectBooking: (bookingId: string) => void;
};

const STATUS_COLOR: Record<string, string> = {
  pending: colors.brass,
  accepted: colors.success,
  declined: colors.danger,
  cancelled: colors.muted,
  completed: colors.copper,
};

export function BookingsListScreen({ role, onBack, onSelectBooking }: Props) {
  const [bookings, setBookings] = useState<BookingListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(() => {
    return fetchMyBookings()
      .then(setBookings)
      .catch(() => setBookings([]));
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  async function handleRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.back} onPress={onBack}>← Back</Text>
      <Text style={styles.title}>My bookings</Text>

      <FlatList
        data={bookings}
        keyExtractor={(b) => b.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.copper} />}
        contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.xl }}
        ListEmptyComponent={
          !loading ? <Text style={styles.empty}>No bookings yet.</Text> : null
        }
        renderItem={({ item }) => (
          <Pressable style={styles.card} onPress={() => onSelectBooking(item.id)}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>
                {role === "worker" ? item.customer.name : item.worker.user.name}
              </Text>
              <Text style={styles.cardMeta}>
                {item.category.name} · {new Date(item.date).toDateString()}
              </Text>
              <Text style={styles.cardMeta} numberOfLines={1}>{item.description}</Text>
            </View>
            <View style={[styles.statusPill, { backgroundColor: STATUS_COLOR[item.status] ?? colors.muted }]}>
              <Text style={styles.statusText}>{item.status}</Text>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper, paddingTop: 56, paddingHorizontal: spacing.md },
  back: { color: colors.copper, fontWeight: "600", marginBottom: spacing.md },
  title: { fontSize: 22, fontWeight: "700", color: colors.ink, marginBottom: spacing.md },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: spacing.md,
    gap: spacing.sm,
  },
  cardTitle: { fontWeight: "700", color: colors.ink, fontSize: 15 },
  cardMeta: { color: colors.muted, fontSize: 12, marginTop: 2 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { color: colors.paper, fontSize: 11, fontWeight: "700", textTransform: "capitalize" },
  empty: { textAlign: "center", color: colors.muted, marginTop: spacing.xl },
});
